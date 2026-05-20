import {
  Bell,
  ChevronRight,
  Check,
  Clapperboard,
  Edit3,
  Flame,
  Info,
  ListFilter,
  Lock,
  LockOpen,
  LogIn,
  LogOut,
  Mail,
  MonitorPlay,
  Play,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  ThumbsUp,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const icons = {
  add: Plus,
  check: Check,
  chevron_right: ChevronRight,
  close: X,
  edit: Edit3,
  filter_list: ListFilter,
  group: Users,
  info: Info,
  live_tv: MonitorPlay,
  local_fire_department: Flame,
  lock: Lock,
  lock_open: LockOpen,
  login: LogIn,
  logout: LogOut,
  mail: Mail,
  movie: Clapperboard,
  notifications: Bell,
  person_add: UserPlus,
  play_arrow: Play,
  search: Search,
  settings: Settings,
  thumb_up: ThumbsUp,
  delete: Trash2,
  tune: SlidersHorizontal,
};

export function Icon({ name, filled = false }) {
  const Component = icons[name] ?? Play;

  return (
    <Component
      aria-hidden="true"
      className={`app-icon${filled ? " app-icon-filled" : ""}`}
      focusable="false"
      strokeWidth={2.25}
    />
  );
}
