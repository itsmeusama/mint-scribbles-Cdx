import { requireChatGPTUser } from "./chatgpt-auth";

export async function getMintAdminAccess(returnTo: string) {
  const user = await requireChatGPTUser(returnTo);
  const ownerEmail = process.env.MINT_ADMIN_EMAIL?.trim().toLowerCase() ?? "";

  return {
    user,
    ownerEmail,
    isOwner: Boolean(ownerEmail && user.email.trim().toLowerCase() === ownerEmail),
  };
}
