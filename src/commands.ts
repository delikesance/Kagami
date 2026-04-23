import { pingCommand } from "./features/utility/commands/ping";
import { helpCommand } from "./features/utility/commands/help";
import { rankCommand } from "./features/levels/commands/rank";
import { leaderboardCommand } from "./features/levels/commands/leaderboard";
import { avatarCommand } from "./features/information/commands/avatar";
import { bannerCommand } from "./features/information/commands/banner";
import { profileCommand } from "./features/information/commands/profile";
import { clearCommand } from "./features/moderation/commands/clear";
import { warnCommand } from "./features/moderation/commands/warn";
import { warningsCommand } from "./features/moderation/commands/warnings";
import { delwarnCommand } from "./features/moderation/commands/delwarn";
import { automodCommand } from "./features/moderation/commands/automod";
import { verifyCommand } from "./features/verification/commands/verify";
import { welcomingCommand } from "./features/welcoming/commands/welcoming";
import { logsCommand } from "./features/logging/commands/logs";
import { reflectionCommand } from "./features/reflections/commands/reflection";
import { gachaCommand } from "./features/gacha/commands/gacha";
import { featuresCommand } from "./features/utility/commands/features";
import { adminCommand } from "./features/utility/commands/admin";
import { devlogCommand } from "./features/utility/commands/devlog";

export const commands = [
  pingCommand,
  helpCommand,
  featuresCommand,
  adminCommand,
  devlogCommand,
  rankCommand,
  leaderboardCommand,
  avatarCommand,
  bannerCommand,
  profileCommand,
  clearCommand,
  warnCommand,
  warningsCommand,
  delwarnCommand,
  automodCommand,
  verifyCommand,
  welcomingCommand,
  logsCommand,
  reflectionCommand,
  gachaCommand,
];
