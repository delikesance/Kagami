import { pingCommand } from "./features/utility/commands/ping";
import { helpCommand } from "./features/utility/commands/help";
import { avatarCommand } from "./features/information/commands/avatar";
import { bannerCommand } from "./features/information/commands/banner";
import { clearCommand } from "./features/moderation/commands/clear";
import { warnCommand } from "./features/moderation/commands/warn";
import { warningsCommand } from "./features/moderation/commands/warnings";
import { delwarnCommand } from "./features/moderation/commands/delwarn";
import { automodCommand } from "./features/moderation/commands/automod";
import { verifyCommand } from "./features/verification/commands/verify";
import { welcomingCommand } from "./features/welcoming/commands/welcoming";
import { logsCommand } from "./features/logging/commands/logs";

export const commands = [
  pingCommand,
  helpCommand,
  avatarCommand,
  bannerCommand,
  clearCommand,
  warnCommand,
  warningsCommand,
  delwarnCommand,
  automodCommand,
  verifyCommand,
  welcomingCommand,
  logsCommand,
];
