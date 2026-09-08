import {
  Camera,
  Tv,
  ThumbsUp,
  Send,
  PlayCircle,
  Music2,
  Users,
  Heart,
  Eye,
  Clapperboard,
  CircleDot,
  UserCheck,
  TrendingUp,
  Radar,
  Bookmark,
  Share2,
  Smile,
  Sparkles,
  Megaphone,
  FileDown,
  Wrench,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

/**
 * Mapeia o nome do ícone salvo no banco (platforms.icon / categories.icon)
 * para o componente lucide-react correspondente. Adicionar aqui ao criar
 * novas plataformas/categorias no admin.
 *
 * Nota: lucide-react removeu os ícones de marca (Instagram/Youtube/Facebook)
 * em versões recentes por questões de licenciamento de logotipo. Usamos
 * ícones genéricos que representam cada plataforma — trocar por SVGs de
 * marca próprios em public/brand-icons/ quando desejar o logo oficial.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Camera,
  Tv,
  ThumbsUp,
  Send,
  PlayCircle,
  Music2,
  Users,
  Heart,
  Eye,
  Clapperboard,
  CircleDot,
  UserCheck,
  TrendingUp,
  Radar,
  Bookmark,
  Share2,
  Smile,
  Megaphone,
  FileDown,
  Wrench,
  Briefcase,
};

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Sparkles;
  return ICON_MAP[name] ?? Sparkles;
}
