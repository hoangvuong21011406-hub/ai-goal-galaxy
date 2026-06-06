import { clusters } from "../data/clusters";

export function removeVietnameseTones(str: string): string {
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  return result;
}

export function classifyGoal(goalText: string) {
  const normalizedText = removeVietnameseTones(goalText);
  const lowercaseText = goalText.toLowerCase();

  let bestClusterId = "other";
  let maxMatches = 0;
  let matchedTags: string[] = [];

  for (const cluster of clusters) {
    if (cluster.id === "other") continue;

    let matches = 0;
    const currentTags: string[] = [];

    for (const keyword of cluster.keywords) {
      // Check in raw lowercase text and normalized tone-free text
      const normKeyword = removeVietnameseTones(keyword);
      if (lowercaseText.includes(keyword) || normalizedText.includes(normKeyword)) {
        matches++;
        if (!currentTags.includes(keyword)) {
          currentTags.push(keyword);
        }
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestClusterId = cluster.id;
      matchedTags = currentTags;
    }
  }

  const activeCluster = clusters.find(c => c.id === bestClusterId) || clusters[clusters.length - 1];

  // If other cluster or no tags, add generic tags derived from goal words or cluster name
  if (matchedTags.length === 0) {
    matchedTags = activeCluster.id !== "other" ? [activeCluster.id] : ["idea"];
  }

  return {
    cluster: activeCluster.id,
    clusterLabel: activeCluster.name,
    tags: matchedTags
  };
}
