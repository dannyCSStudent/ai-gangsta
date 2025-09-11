// apps/frontend-mobile/lib/api/postTruth.ts

export async function analyzePost(post: string) {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/analyze-post/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ post }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing post:", error);
    throw error;
  }
}
