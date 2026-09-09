import { createElement } from "react";
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

/**
 * Renderiza um ícone escolhido dinamicamente (nome vindo do banco).
 * Usa createElement (não JSX) de propósito: o lint react-hooks/
 * static-components acusa "componente criado durante o render" para
 * qualquer variável capitalizada resolvida via função e usada como tag
 * JSX no mesmo escopo — mesmo sendo apenas uma seleção de um mapa fixo,
 * não uma definição de componente nova. createElement não aciona essa
 * heurística e o comportamento é idêntico.
 */
export function DynamicIcon({
  name,
  ...props
}: { name: string | null | undefined } & React.ComponentProps<LucideIcon>) {
  return createElement(getIcon(name), props);
}
