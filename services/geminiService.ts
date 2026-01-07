

import { GoogleGenAI } from "@google/genai";
import { SERVICES, PROFESSIONALS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Você é a assistente virtual inteligente do "Agende Certo", uma barbearia premium.
Seu objetivo é ajudar os clientes a escolherem o melhor serviço e profissional, ou tirar dúvidas sobre o agendamento.

Contexto da Barbearia:
- Serviços Disponíveis: ${SERVICES.map(s => `${s.name} ${typeof s.price === 'number' ? `(R$ ${s.price})` : '(preço a consultar)'}`).join(', ')}.
- Profissionais: ${PROFESSIONALS.map(p => `${p.name} (${p.role})`).join(', ')}.

Diretrizes:
- Seja curta, educada e direta.
- Use emojis ocasionalmente.
- Se o usuário perguntar sobre preços, liste apenas os relevantes.
- Se o usuário pedir uma recomendação, pergunte o estilo dele ou sugira o 'Combo' para melhor custo-benefício.
- Responda sempre em Português do Brasil.
`;

export const sendMessageToGemini = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    // FIX: Removed redundant mapping of history array.
    const contents = [
      ...history,
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Desculpe, não consegui processar sua resposta no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, estou tendo dificuldades técnicas. Por favor, tente novamente mais tarde.";
  }
};