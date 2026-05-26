"use client";

import {
  Bell,
  Bookmark,
  CheckCircle,
  ChevronRight,
  Check,
  Clapperboard,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  Flame,
  HelpCircle,
  History,
  Home,
  Info,
  ListFilter,
  Lock,
  LockOpen,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MonitorPlay,
  Play,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Star,
  ThumbsUp,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
  Lightbulb,
} from "lucide-react";

const icons = {
  add: Plus,
  bookmark: Bookmark,
  check: Check,
  check_circle: CheckCircle,
  chevron_right: ChevronRight,
  close: X,
  delete: Trash2,
  delete_forever: Trash2,
  edit: Edit3,
  eye: Eye,
  eye_off: EyeOff,
  filter_list: ListFilter,
  group: Users,
  help: HelpCircle,
  history: History,
  home: Home,
  info: Info,
  live_tv: MonitorPlay,
  local_fire_department: Flame,
  lock: Lock,
  lock_open: LockOpen,
  login: LogIn,
  logout: LogOut,
  mail: Mail,
  menu: Menu,
  movie: Clapperboard,
  notifications: Bell,
  person: User,
  person_add: UserPlus,
  play_arrow: Play,
  recommend: Lightbulb,
  search: Search,
  settings: Settings,
  star: Star,
  thumb_up: ThumbsUp,
  tune: SlidersHorizontal,
  watchlist: Clock,
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
