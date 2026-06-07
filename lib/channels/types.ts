import type { ConversationChannel } from "@/lib/types";

export type ChannelMessageDraft = {
  to: string;
  subject: string;
  body: string;
};

export type ChannelSendResult = {
  provider: string;
  externalMessageId?: string;
  status: "queued" | "sent" | "mocked";
};

export interface ChannelProvider {
  readonly channel: ConversationChannel;
  readonly name: string;
  send(message: ChannelMessageDraft): Promise<ChannelSendResult>;
}
