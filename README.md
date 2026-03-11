# Telemetry Anomaly Engine (Edge AI Predictive Maintenance)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)
![ML](https://img.shields.io/badge/ML-scikit--learn-orange.svg)

## El Problema de Negocio 🏭
Las empresas de manufactura pesada y los Data Centers generan terabytes de métricas por minuto. El mantenimiento reactivo causa inactividad no planificada que cuesta miles de dólares. Procesar todos estos datos sincrónicamente colapsa los servidores, y enviarlos a la nube (OpenAI) introduce latencia inaceptable y riesgos de privacidad de datos masivos.

## La Solución de Ingeniería 🚀
Un motor de ingesta de datos en tiempo real extremadamente ligero (<< 5GB) creado con Python. Implementa **Clean Architecture** y un patrón **Productor-Consumidor** para la ingesta asíncrona de telemetría. Utiliza motores de **Machine Learning (Isolation Forests)** para Edge Computing, prediciendo fallos de sensores antes de que la máquina sufra un daño crítico, *todo on-premise y sin bloquear el hilo principal de Node/API.*

---

## 🏗️ Arquitectura del Sistema

1.  **Capa Ingesta (FastAPI):** Proporciona un endpoint veloz (`POST /api/v1/telemetry/ingest`) validado fuertemente con Pydantic.
2.  **Broker de Mensajes (Redis):** Actúa como amortiguador (buffer). Cuando llegan 10,000 peticiones en 1 segundo, la API no se cae, las encola en Redis.
3.  **Procesamiento Asíncrono (Celery):** Workers en segundo plano digieren la cola de Redis a su propio ritmo.
4.  **Capa de Inteligencia (Scikit-Learn):** Un modelo de *Isolation Forest* precargado en memoria analiza la triada `[Temperatura, Vibración, CPU]` clasificando si la máquina está operando en parámetros normales o si una Anomalía Crítica está ocurriendo.

## 💻 Frontend "Modo Demo" para GitHub Pages
Dado que este sistema está diseñado como un clúster Backend, se incluye un frontend corporativo en la carpeta `/frontend`. 
*   **En Producción:** Consumiría la API en vivo.
*   **En GitHub Pages:** Utiliza el script `app.js` para inyectar datos sintéticos (Mock Data) recreando la experiencia visual de un dashboard analítico real de Industria 4.0 para los reclutadores.

---

## 🛠️ Cómo Iniciar (Developer Experience)

El proyecto viene completamente contenedorizado para evitar el "En mi máquina sí funciona".

### Requisitos Prerequisitos
*   Docker y Docker Compose instalados.

### Comandos de Despliegue (Makefile)
```bash
# 1. Levantar toda la infraestructura (FastAPI, Redis, Celery Worker)
make up

# 2. Ver en vivo como el Worker de ML procesa las matrices de datos
make logs-worker

# 3. Correr la batería de pruebas automatizadas
make test

# 4. Apagar clúster
make down
```

### Probar la API de Ingesta Manualmente
Con el servidor arriba (en `localhost:8000`), abre otra terminal e inyecta telemetría anómala:
```bash
curl -X POST "http://localhost:8000/api/v1/telemetry/ingest" \
     -H "Content-Type: application/json" \
     -d '{
           "machine_id": "MACH-01",
           "readings": [
             {
               "sensor_id": "SENS-01",
               "temperature": 150.5,
               "vibration_hz": 200.0,
               "cpu_usage_pct": 99.9
             }
           ]
         }'
```
Observa el terminal de Celery (`make logs-worker`) para ver cómo el algoritmo detecta la condición crítica casi al instante y dispara la Alerta 🚨.

---

> *Este proyecto demuestra la interconexión de Data Engineering, Machine Learning no supervisado para mantenimiento predictivo y orquestación Cloud-Native mediante Python moderno.*
