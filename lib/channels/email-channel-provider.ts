import type { ChannelMessageDraft, ChannelProvider, ChannelSendResult } from "@/lib/channels/types";

export class MockEmailChannelProvider implements ChannelProvider {
  readonly channel = "EMAIL" as const;
  readonly name = "mock-email";

  async send(_message: ChannelMessageDraft): Promise<ChannelSendResult> {
    return {
      provider: this.name,
      status: "mocked"
    };
  }
}
