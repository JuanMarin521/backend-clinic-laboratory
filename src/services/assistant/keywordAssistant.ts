/**
 * Asistente de respaldo por palabras clave (sin IA), con la voz de Polito.
 * Responde cuando no hay clave de Gemini configurada o cuando la IA falla
 * (sin internet, cuota agotada, demora), para que el chat nunca se quede sin respuesta.
 */
export function buildKeywordReply(userText: string): string {
  // Sin tildes y en minusculas: "¿Cuándo?" y "cuando" se reconocen igual.
  const normalizedText = userText
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  if (normalizedText.includes('resultado')) {
    return 'Tus exámenes pueden estar listos, en proceso o con novedad. Los encuentras todos en la pestaña Resultados, con su semáforo de colores.';
  }

  if (normalizedText.includes('lista') || normalizedText.includes('cuando')) {
    return 'Apenas el laboratorio valide tu examen, su estado cambia a Listo en la pestaña Resultados y ya puedes descargarlo en PDF.';
  }

  if (normalizedText.includes('sede') || normalizedText.includes('contactar')) {
    return 'Lo mejor es comunicarte con la sede donde te tomaron la muestra; allá te dan toda la información sobre cualquier novedad.';
  }

  return 'Gracias por escribirme. En este momento solo puedo darte información general; para algo más específico, comunícate con la sede donde te tomaron la muestra.';
}
