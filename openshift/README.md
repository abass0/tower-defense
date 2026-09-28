# OpenShift demo artifacts

Minimal, demo-focused manifests - not a production reference architecture.
Numbered in the order you apply them, matching this narrative:

```
V1 running  ->  introduce leaderboard requirement  ->  provision MongoDB/configuration
->  run the pipeline  ->  build V2  ->  rollout V2  ->  play a match  ->  score persists  ->  leaderboard appears
```

## Prerequisites

- An OpenShift project selected (`oc new-project tower-defense-demo` or `oc project <name>`) - no `Namespace` object is included here on purpose.
- The **OpenShift Pipelines** operator already installed, with its default `git-clone`, `buildah`, and `openshift-client` ClusterTasks available, and the `pipeline` ServiceAccount already auto-created in this namespace.
- The V1 image already pushed somewhere `01-towerdefense-deployment.yaml` can pull from (or built once manually the same way the Pipeline builds V2 - see Phase 3).

## Before applying

- Replace `<NAMESPACE>` in `01-towerdefense-deployment.yaml` with your actual project name.
- Change the placeholder password in `04-mongodb-secret.yaml`.

## Phase 1 - "V1 running"

```bash
oc apply -f 01-towerdefense-deployment.yaml
oc apply -f 02-towerdefense-service.yaml
oc apply -f 03-towerdefense-route.yaml
```

Play the game through the Route's URL (`oc get route tower-defense`). This is the moment you introduce the business requirement.

## Phase 2 - "provision MongoDB/configuration"

```bash
oc apply -f 04-mongodb-secret.yaml
oc apply -f 05-mongodb-configmap.yaml
oc apply -f 06-mongodb-pvc.yaml
oc apply -f 07-mongodb-deployment.yaml
oc apply -f 08-mongodb-service.yaml
oc apply -f 09-towerdefense-configmap.yaml
```

MongoDB is now running and fully configured. The app is still the V1 image, which has no idea any of this exists - a good moment to point out that provisioning infrastructure and upgrading the app are two independent actions.

## Phase 3 - "run the pipeline -> build V2 -> rollout V2"

```bash
oc apply -f 10-imagestream.yaml
oc apply -f 11-pipeline-rbac.yaml
oc apply -f 12-pipeline.yaml
oc create -f 13-pipelinerun.yaml     # generateName - repeatable, use `create` not `apply`
```

Watch it with `tkn pipelinerun logs -f -L`, or `oc get pipelinerun -w`. The Pipeline's last task (`deploy`) patches the same Deployment from Phase 1 and waits for the rollout - no other object changes.

## Payoff - no new YAML

Play a match through the same Route from Phase 1. On Game Over, submit a score; the leaderboard now loads instead of showing "unavailable."

## Known caveats (see also the design-review discussion that produced this folder)

- **Health checks never depend on Mongo.** `/api/health` always returns `200`; Mongo's status is informational data in the response body only. This is deliberate - a database blip must never look like an unhealthy app pod to OpenShift's probes.
- **No hardcoded `fsGroup`** on the Mongo Deployment - see the comment in `07-mongodb-deployment.yaml` for why, and what to do if a specific cluster needs one anyway.
- **ClusterTask parameter names** in `12-pipeline.yaml` assume commonly-installed versions of `git-clone`/`buildah`/`openshift-client`. Verify with `tkn clustertask describe <name>` before the live demo.
- **Single Secret for both consumers.** `04-mongodb-secret.yaml` provides both `MONGO_INITDB_ROOT_*` (read by the `mongo` image) and `MONGODB_*` (read by the app) key names, to avoid a second Secret file.
- **Plain Deployment, not the MongoDB Community Operator.** Simpler and more transparent for a demo; swap this file if you ever want to demo the Operator pattern instead.
