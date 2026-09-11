import type { Words } from "./facts";

/**
 * Everything the site says in English.
 */
export const ENGLISH: Words = {
  works: {
    "agent-pipeline": {
      title: "agent-pipeline: multi-agent orchestration",
      problem:
        "AI-assisted development delivers fast and leaves no trace. Nothing says who decided what, nor what was " +
        "verified before the code went in.",
      did:
        "Separated the roles: Product defines, the implementer writes, QA validates without writing, the " +
        "orchestrator controls the transitions. A state machine bounds the moves, executable gates refuse, and " +
        "every proof is attached to a commit by its digest.",
      result:
        "This page is the demonstration: it is built by that pipeline, and every decision behind its design is " +
        "written in its journal.",
      diagram: {
        alt:
          "The Product role defines, the code is written, review validates, closure records. The quality gates " +
          "stand on the path and can send the work back.",
        caption: "One issue cycle",
        source: "Node.js, MIT",
        labels: { product: "PRODUCT", code: "CODE", review: "REVIEW", gates: "GATES", closure: "CLOSURE" },
      },
    },
    decodevoyage: {
      title: "decodevoyage.com, delivered by steering agents",
      problem:
        "Deliver a complete public application alone: architecture, domain models, search visibility, compliance.",
      did:
        "Wrote the specifications and the architecture, then steered coding agents for the implementation, " +
        "reviewing critically what they produced rather than accepting it.",
      diagram: {
        alt:
          "A specification feeds coding agents, which produce code, and that code goes through critical review " +
          "before returning to the agents.",
        caption: "Steering rather than typing",
        source: "Critical review",
        labels: { spec: "SPEC", agents: "AGENTS", code: "CODE", review: "REVIEW" },
      },
    },
    "assistants-llm": {
      title: "LLM assistants and agents in production",
      problem:
        "An assistant reading a company's data must read only what its user is entitled to, and must never let " +
        "another customer's data leak.",
      did:
        "Put the entitlement check on the data path rather than beside it: isolation between customers, control " +
        "by role, traceability of the sources quoted. Then monitored usage and inference cost, and iterated from " +
        "user feedback.",
      diagram: {
        alt:
          "A request from a business user enters the agent, passes the entitlement check, reaches that company's " +
          "records, and the answer travels back.",
        caption: "The path of a request",
        source: "OpenAI, Claude",
        labels: { asker: "BUSINESS", agent: "AGENT", answer: "ANSWER", rights: "RIGHTS", records: "RECORDS" },
      },
    },
    paiement: {
      title: "Payment microservice",
      problem:
        "Every payment held the order until the bank answered. When a service went down, the orders in flight " +
        "were lost.",
      did:
        "Put a message queue between the interface and the processing: the order is accepted straight away, " +
        "processed afterwards, and nothing disappears when a service restarts. Layered architecture, strict " +
        "separation of the domain from data access.",
      diagram: {
        alt:
          "An order goes through the API, enters a message queue, then is written to the database. The cache " +
          "answers reads directly.",
        caption: "The flow of a payment",
        source: "Kafka, Redis",
        labels: { buyer: "BUYER", api: "API", cache: "CACHE", queue: "QUEUE", store: "DATABASE" },
      },
    },
  },
  experiences: {
    modjo: {
      role: "Developer, LLM agents and assistants in production",
      summary:
        "SaaS vendor. Assistants plugged into customer data, with isolation between customers and control by " +
        "role on the data path, then monitoring of usage and inference cost.",
    },
    everest: {
      role: "Back-end developer",
      summary:
        "Business microservices: payment, a message queue between the services, strict separation of the domain " +
        "from data access.",
    },
    cie: {
      role: "Full-stack Angular developer",
      summary: "Business applications of a national electricity operator: modelling, database and interfaces.",
    },
    synelia: {
      role: "Front-end Angular developer",
      summary: "Web interfaces, and a contribution to a mobile application.",
    },
  },
  education: {
    "master-miage": {
      degree: "MIAGE master's degree, DLIS track",
      institution: "University of Rennes, software development and systems integration",
    },
    "licence-miage": { degree: "MIAGE bachelor's degree", institution: "Félix Houphouët-Boigny University, Abidjan" },
  },
  certifications: [],
  skills: {
    llm: { name: "LLM agents & assistants" },
    platform: { name: "Agentic platform" },
    security: { name: "Security & governance" },
    development: { name: "Development" },
    data: { name: "Data" },
    devops: { name: "DevOps" },
    interfaces: { name: "Interfaces" },
    methods: { name: "Methods" },
  },
  terms: {
    "automated-tests": "Automated tests",
    "code-review": "Code review",
    gdpr: "GDPR",
    "inference-cost": "Inference cost",
    "quality-gates": "Quality gates",
    "rest-api": "REST API",
    specification: "Specification",
    "state-machine": "State machine",
    "technical-documentation": "Technical documentation",
    "technical-seo": "Technical SEO",
    "tenant-isolation": "Tenant isolation",
    traceability: "Traceability",
  },
};
