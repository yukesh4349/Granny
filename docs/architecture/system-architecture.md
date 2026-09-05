# System Architecture

The Elderly AI Companion (Granny) is designed with high availability, low voice latency, and strict safety guardrails.

## Diagram
```
  [Mobile App (React Native / Expo)]    [Web Portal (React + Vite)]
                   \                             /
                    \                           /
                     ▼                         ▼
                  [NestJS API Gateway & Backend]
                       /                 \
                      /                   \
                     ▼                     ▼
          [PostgreSQL Database]     [FastAPI AI Service]
             (Prisma ORM)             - Speech-to-Text (Whisper)
                                      - Empathetic Dialog (LLM)
                                      - Long-term Memory Recall
                                      - Text-to-Speech (TTS)
```
