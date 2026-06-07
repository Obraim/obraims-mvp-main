import { MockEmailChannelProvider } from "@/lib/channels/email-channel-provider";
import type { ChannelProvider } from "@/lib/channels/types";
import type { ConversationChannel } from "@/lib/types";

export function getChannelProvider(channel: ConversationChannel): ChannelProvider {
  switch (channel) {
    case "EMAIL":
      return new MockEmailChannelProvider();
    case "SMS":
    case "WHATSAPP":
    case "TELEGRAM":
    case "IN_APP":
      throw new Error(`${channel} channel provider is not implemented yet.`);
    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }
}
