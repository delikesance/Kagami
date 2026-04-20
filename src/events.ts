import { readyEvent } from "./shared/events/ready";
import { interactionCreateEvent } from "./shared/events/interactionCreate";
import { guildMemberAddEvent } from "./features/welcoming/events/memberAdd";
import { 
  memberRemoveEvent, 
  memberUpdateEvent, 
  banAddEvent, 
  banRemoveEvent 
} from "./features/logging/events/memberEvents";
import { 
  messageDeleteEvent, 
  messageUpdateEvent 
} from "./features/logging/events/messageEvents";
import { 
  roleCreateEvent, 
  roleDeleteEvent, 
  roleUpdateEvent, 
  channelCreateEvent, 
  channelDeleteEvent, 
  channelUpdateEvent 
} from "./features/logging/events/guildEvents";
import {
  automodMessageCreateEvent,
  automodMessageUpdateEvent
} from "./features/moderation/events/automodEvents";
import { verificationInteractionEvent } from "./features/verification/events/verificationInteractions";
import { verificationMessageEvent } from "./features/verification/events/verificationMessage";
import { xpMessageEvent } from "./features/levels/events/xpEvents";

export const events = [
  readyEvent,
  interactionCreateEvent,
  guildMemberAddEvent,
  memberRemoveEvent,
  memberUpdateEvent,
  banAddEvent,
  banRemoveEvent,
  messageDeleteEvent,
  messageUpdateEvent,
  roleCreateEvent,
  roleDeleteEvent,
  roleUpdateEvent,
  channelCreateEvent,
  channelDeleteEvent,
  channelUpdateEvent,
  automodMessageCreateEvent,
  automodMessageUpdateEvent,
  verificationInteractionEvent,
  verificationMessageEvent,
  xpMessageEvent,
];
