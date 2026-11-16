import { describe, expect, it } from 'vitest';
import { formatarHorario } from './horario';

describe('horário de funcionamento', () => {
  it('traduz e junta as faixas do mesmo dia', () => {
    expect(formatarHorario('Sunday,6,10:30PM|Monday,11AM,2:15PM|Monday,6,10:30PM|Tuesday,Closed')).toBe('Seg 11h–14h15 e 18h–22h30 · Ter fechado · Dom 18h–22h30');
  });
  it('lê abertura sem AM/PM pelo fechamento', () => {
    expect(formatarHorario('Friday,6,11:30PM')).toBe('Sex 18h–23h30');
    expect(formatarHorario('Saturday,10,2PM')).toBe('Sáb 10h–14h');
  });
  it('não quebra com formato desconhecido', () => {
    expect(formatarHorario('qualquer coisa')).toBeNull();
    expect(formatarHorario(null)).toBeNull();
  });
});
