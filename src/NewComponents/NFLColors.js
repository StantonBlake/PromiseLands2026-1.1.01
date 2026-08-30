import nflColors from './NFLColors.json';

export const teamColorMap = {};
nflColors.forEach(team => {
  teamColorMap[team.team] = [team.color, team.color2].filter(Boolean);
});

export function getTeamGradient(teamAbbrev) {
  const colors = teamColorMap[teamAbbrev];
  if (!colors || colors.length === 0) {
    return 'linear-gradient(150deg, #999, #666)'; // fallback
  }
  return `linear-gradient(150deg, ${colors.join(', ')})`;
}

export function getContrastColor(hex) {
  if (!hex) return '#fff';

  const c = hex.startsWith('#') ? hex.substring(1) : hex;

  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.3 ? '#000' : '#fff';
}
