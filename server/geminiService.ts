import { GoogleGenAI, Type } from "@google/genai";
import { GoalItem, ClusterItem } from "../src/types";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ GEMINI_API_KEY is not defined. Fallback to keyword-based classification.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

interface GeminiAnalyzeResult {
  clusterId: string;
  clusterLabel: string;
  tags: string[];
  analysis: string;
  newClusterCreated: boolean;
  newClusterData?: ClusterItem;
}

/**
 * Generates a beautiful 3D coordinate for a new cluster.
 * Keeps it at a reasonable distance from existing ones to avoid overlapping.
 */
export function generateNewClusterPosition(existingClusters: ClusterItem[]): [number, number, number] {
  let bestPos: [number, number, number] = [0, 0, 0];
  let maxMinDistance = 0;

  // Try 50 times to find a position with the largest distance to the closest neighbor
  for (let i = 0; i < 50; i++) {
    // Random position in a expanded sphere with radius 9.5-15.0 to align with wider spread
    const r = 9.5 + Math.random() * 5.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = Number((r * Math.sin(phi) * Math.cos(theta)).toFixed(2));
    const y = Number((r * Math.sin(phi) * Math.sin(theta)).toFixed(2));
    const z = Number((r * Math.cos(phi)).toFixed(2));

    let minDistance = 999;
    for (const c of existingClusters) {
      const dx = x - c.position[0];
      const dy = y - c.position[1];
      const dz = z - c.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    if (minDistance > maxMinDistance) {
      maxMinDistance = minDistance;
      bestPos = [x, y, z];
    }
  }

  return bestPos;
}

/**
 * Calls Gemini LLM to analyze the goal, matching it against existing ideas and clusters,
 * or producing a brand new cluster if needed.
 */
export async function analyzeGoalWithGemini(
  name: string,
  goalText: string,
  existingGoals: GoalItem[],
  existingClusters: ClusterItem[]
): Promise<GeminiAnalyzeResult> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error("No Gemini Client");
  }

  // Optimize prompt input: send the key summaries of existing goals & groups
  const clustersFormatted = existingClusters.map(c => `- ID: "${c.id}", Name: "${c.name}", Description: "${c.description}"`).join("\n");
  const goalsSummary = existingGoals
    .slice(0, 30) // Take up to 30 recent items for context to avoid huge payloads
    .map(g => `- Learner: "${g.name}", Idea: "${g.goal}", Cluster: "${g.cluster}"`)
    .join("\n");

  const prompt = `
You are the AI Orchestrator of the "AI Goal Galaxy". 
A learner has submitted a new tech product goal / idea for our 3D galaxy visualization map.

Learner Name: "${name}"
Goal Description: "${goalText}"

Current Active Clusters in the Galaxy:
${clustersFormatted}

Some Recent Learner Submissions for Context:
${goalsSummary}

Your tasks:
1. Analyze this learner's goal.
2. Search the recent learner submissions listed above to see if there is any strong similarity, identical concepts, or ideas where they could cooperate/share technologies (even if subtly).
3. Classify the goal into one of the existing clusters.
4. IMPORTANT: If and only if the goal represents a truly distinct theme/domain that does not comfortably fit the current clusters (excluding the "other" cluster which is a fallback), set "createNewCluster" to true and propose a novel, creative Cluster. DO NOT create new clusters wastefully; only do so if it's a completely different genre (e.g., AI Medical/Surgical, AI Robotics, AI Finance, Web3 AI, AI IoT/Hardware, ClimateTech AI) that should shine separately.
5. Create 3 to 4 specific, low-case tags describing the tech stack or use case (e.g., "chatbot", "nlp", "rag").
6. Provide an inspiring, concise analysis/feedback in Vietnamese (2 to 3 sentences). In this analysis:
   - Comment on the creativity and impact of the goal.
   - If there is a similar goal by another student (e.g. An, Minh, Linh...), mention it naturally (e.g., "Ý tưởng này chia sẻ giao điểm sáng tạo với dự án chatbot của An...") and explain how they can enrich each other.
   - Suggest relevant modern technologies or APIs (e.g., Gemini Flash, LangChain, CrewAI, shadcn...).
`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an assistant expert in software engineering, AI pipelines, and student mentorship. You output formatted JSON matching custom specs perfectly.",
        temperature: 0.2, // low temp for accurate class matching
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedClusterId: {
              type: Type.STRING,
              description: "The ID of the existing cluster that fits best. If createNewCluster is true, this can be an empty string ''."
            },
            createNewCluster: {
              type: Type.BOOLEAN,
              description: "True if we should spawn a brand new cluster for this idea."
            },
            newCluster: {
              type: Type.OBJECT,
              description: "Mandatory if createNewCluster is true. Contain information for the new cluster.",
              properties: {
                id: { type: Type.STRING, description: "Unique snake_case id (e.g. 'ai_robotics')" },
                name: { type: Type.STRING, description: "Name of the cluster in Vietnamese, elegant and tech-pro (e.g. 'AI Robotics & Phần cứng')" },
                description: { type: Type.STRING, description: "Detailed description of what this cluster holds in Vietnamese (e.g. 'Các trợ lý phần cứng, robot thông minh, IoT tích hợp mô hình ngôn ngữ lớn')" },
                keywords: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Keywords associated with this theme" 
                }
              },
              required: ["id", "name", "description", "keywords"]
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 4 technical keywords in lowercase"
            },
            analysis: {
              type: Type.STRING,
              description: "Professional and warm Vietnamese feedback (2-3 sentences), citing similar projects/ideas if applicable, suggesting real tools."
            }
          },
          required: ["matchedClusterId", "createNewCluster", "tags", "analysis"]
        }
      }
    });

    const bodyText = response.text || "{}";
    const resObj = JSON.parse(bodyText.trim());

    if (resObj.createNewCluster && resObj.newCluster) {
      const nc = resObj.newCluster;
      // Propose cluster
      const pos = generateNewClusterPosition(existingClusters);
      const newClusterItem: ClusterItem = {
        id: nc.id.toLowerCase().replace(/\s+/g, "_"),
        name: nc.name,
        description: nc.description,
        keywords: nc.keywords || [],
        position: pos
      };
      
      return {
        clusterId: newClusterItem.id,
        clusterLabel: newClusterItem.name,
        tags: resObj.tags || [newClusterItem.id],
        analysis: resObj.analysis,
        newClusterCreated: true,
        newClusterData: newClusterItem
      };
    } else {
      const matchedId = resObj.matchedClusterId || "other";
      const clusterObj = existingClusters.find(c => c.id === matchedId) || existingClusters.find(c => c.id === "other") || existingClusters[0];
      return {
        clusterId: clusterObj.id,
        clusterLabel: clusterObj.name,
        tags: resObj.tags || [clusterObj.id],
        analysis: resObj.analysis,
        newClusterCreated: false
      };
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
}
