# Insurance Intelligence Platform

An AI-powered, AWS-hosted enterprise platform designed to automate and centralize the entire insurance lifecycle.

## Overview

This platform enables insurance companies to efficiently manage policy issuance, customer onboarding, and agent performance. It streamlines the claims processing workflow with real-time notifications and integrates machine learning to automatically flag fraudulent claims for investigation prior to settlement.

## Tech Stack

- **Frontend:** ReactJS
- **Core API:** Spring Boot
- **Intelligence & ETL:** Python (FastAPI)
- **Real-time Alerts:** Node.js (Socket.IO)
- **Database:** SQL
- **Infrastructure:** AWS (EC2 & S3)

## High-Level Architecture Flow

```text
 ┌────────────────┐       HTTP/REST        ┌──────────────────────┐
 │                │ ─────────────────────> │                      │
 │  User Interface│                        │  Core Backend API    │
 │   (ReactJS)    │ <───────────────────── │    (Spring Boot)     │
 │                │                        │                      │
 └──────┬─────────┘                        └──────┬─────────┬─────┘
        │                                         │         │
        │ WebSockets                              │ REST    │ SQL
        │                                         ▼         ▼
 ┌──────▼─────────┐  Internal Trigger      ┌──────────────────────┐
 │                │ <───────────────────── │                      │
 │  Notification  │                        │ Intelligence & ML    │
 │    Engine      │                        │  (Python FastAPI)    │
 │  (Node.js)     │                        │                      │
 └────────────────┘                        └──────────────────────┘
```
