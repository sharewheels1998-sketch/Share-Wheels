import { baseUrl } from "../Config";

export const submitFeedback = async (token, { message, category = "general" }) => {
  const res = await fetch(`${baseUrl}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, category }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Could not send feedback");
  }
  return data;
};
