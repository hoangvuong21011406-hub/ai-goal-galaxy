export interface GoalItem {
  id: string;
  name: string;
  goal: string;
  cluster: string;
  clusterLabel: string;
  tags: string[];
  x: number;
  y: number;
  z: number;
  createdAt: string;
  analysis?: string; // AI generated synthesis of this goal, highlighting relationships, impact, suggestion
  email?: string; // Linked secure email for unique student deduplication
}

export interface CourseGoals {
  courseName: string;
  items: GoalItem[];
  clusters?: ClusterItem[]; // Dynamically generated or seeded cluster categories
}

export interface ClusterItem {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  position: [number, number, number];
}
