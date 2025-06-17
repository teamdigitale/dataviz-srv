{{/*
Expand the name of the chart.
*/}}
{{- define "dataviz-srv.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "dataviz-srv.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "dataviz-srv.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "dataviz-srv.labels" -}}
helm.sh/chart: {{ include "dataviz-srv.chart" . }}
{{ include "dataviz-srv.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "dataviz-srv.selectorLabels" -}}
app.kubernetes.io/name: {{ include "dataviz-srv.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "dataviz-srv.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "dataviz-srv.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database connection string
*/}}
{{- define "dataviz-srv.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:$(POSTGRES_PASSWORD)@%s-postgresql:5432/%s" .Values.postgresql.auth.username (include "dataviz-srv.fullname" .) .Values.postgresql.auth.database }}
{{- else }}
{{- printf "postgresql://%s:$(POSTGRES_PASSWORD)@%s:%v/%s" .Values.externalDatabase.username .Values.externalDatabase.host .Values.externalDatabase.port .Values.externalDatabase.database }}
{{- end }}
{{- end }}