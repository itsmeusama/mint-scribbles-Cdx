import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";

function ownerEmail() {
  return process.env.MINT_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export async function getMintAdminAccess(returnTo: string) {
  const user = await requireChatGPTUser(returnTo);
  const configuredOwnerEmail = ownerEmail();

  return {
    user,
    ownerEmail: configuredOwnerEmail,
    isOwner: Boolean(configuredOwnerEmail && user.email.trim().toLowerCase() === configuredOwnerEmail),
  };
}

export async function getMintAdminApiAccess() {
  const user = await getChatGPTUser();
  const configuredOwnerEmail = ownerEmail();

  return {
    user,
    ownerEmail: configuredOwnerEmail,
    isOwner: Boolean(user && configuredOwnerEmail && user.email.trim().toLowerCase() === configuredOwnerEmail),
  };
}
