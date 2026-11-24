
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "acciones": {
                  Row: {
                    "created_at": string,"descripcion": string | null,"fase_pdca": Database["public"]['Enums']["fase_pdca"],"fecha_objetivo": string | null,"hallazgo_id": string | null,"id": string,"kpi_id": string | null,"prioridad": Database["public"]['Enums']["prioridad"],"proyecto_id": string,"responsable_id": string | null,"resultado": string | null,"titulo": string,"updated_at": string,"visible_cliente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"descripcion"?: string | null,"fase_pdca"?: Database["public"]['Enums']["fase_pdca"],"fecha_objetivo"?: string | null,"hallazgo_id"?: string | null,"id"?: string,"kpi_id"?: string | null,"prioridad"?: Database["public"]['Enums']["prioridad"],"proyecto_id": string,"responsable_id"?: string | null,"resultado"?: string | null,"titulo": string,"updated_at"?: string,"visible_cliente"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"descripcion"?: string | null,"fase_pdca"?: Database["public"]['Enums']["fase_pdca"],"fecha_objetivo"?: string | null,"hallazgo_id"?: string | null,"id"?: string,"kpi_id"?: string | null,"prioridad"?: Database["public"]['Enums']["prioridad"],"proyecto_id"?: string,"responsable_id"?: string | null,"resultado"?: string | null,"titulo"?: string,"updated_at"?: string,"visible_cliente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "acciones_hallazgo_id_fkey"
      columns: ["hallazgo_id"]
isOneToOne: false
      referencedRelation: "hallazgos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "acciones_kpi_id_fkey"
      columns: ["kpi_id"]
isOneToOne: false
      referencedRelation: "kpis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "acciones_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "acciones_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "acciones_responsable_id_fkey"
      columns: ["responsable_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"actas": {
                  Row: {
                    "acuerdos": NonNullable<Json>,"asistentes": string | null,"contenido": string | null,"creado_por": string | null,"created_at": string,"fecha": string,"id": string,"proyecto_id": string,"titulo": string,"visible_cliente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "acuerdos"?: NonNullable<Json>,"asistentes"?: string | null,"contenido"?: string | null,"creado_por"?: string | null,"created_at"?: string,"fecha"?: string,"id"?: string,"proyecto_id": string,"titulo": string,"visible_cliente"?: boolean
                  }
                  Update: {
                    "acuerdos"?: NonNullable<Json>,"asistentes"?: string | null,"contenido"?: string | null,"creado_por"?: string | null,"created_at"?: string,"fecha"?: string,"id"?: string,"proyecto_id"?: string,"titulo"?: string,"visible_cliente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "actas_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "actas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "actas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"auditoria_respuestas": {
                  Row: {
                    "auditoria_id": string,"foto_path": string | null,"id": string,"item_id": string,"nota": string | null,"updated_at": string,"valor": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "auditoria_id": string,"foto_path"?: string | null,"id"?: string,"item_id": string,"nota"?: string | null,"updated_at"?: string,"valor"?: number | null
                  }
                  Update: {
                    "auditoria_id"?: string,"foto_path"?: string | null,"id"?: string,"item_id"?: string,"nota"?: string | null,"updated_at"?: string,"valor"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "auditoria_respuestas_auditoria_id_fkey"
      columns: ["auditoria_id"]
isOneToOne: false
      referencedRelation: "auditorias"
      referencedColumns: ["id"]
    }
                  ]
                },"auditorias": {
                  Row: {
                    "area": Database["public"]['Enums']["area_auditoria"],"auditor_id": string | null,"contenido": NonNullable<Json>,"created_at": string,"estado": Database["public"]['Enums']["estado_auditoria"],"fecha": string,"id": string,"notas": string | null,"plantilla_id": string | null,"proyecto_id": string,"puntuacion": number | null,"titulo": string,"visible_cliente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "area": Database["public"]['Enums']["area_auditoria"],"auditor_id"?: string | null,"contenido"?: NonNullable<Json>,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_auditoria"],"fecha"?: string,"id"?: string,"notas"?: string | null,"plantilla_id"?: string | null,"proyecto_id": string,"puntuacion"?: number | null,"titulo": string,"visible_cliente"?: boolean
                  }
                  Update: {
                    "area"?: Database["public"]['Enums']["area_auditoria"],"auditor_id"?: string | null,"contenido"?: NonNullable<Json>,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_auditoria"],"fecha"?: string,"id"?: string,"notas"?: string | null,"plantilla_id"?: string | null,"proyecto_id"?: string,"puntuacion"?: number | null,"titulo"?: string,"visible_cliente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "auditorias_auditor_id_fkey"
      columns: ["auditor_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "auditorias_plantilla_id_fkey"
      columns: ["plantilla_id"]
isOneToOne: false
      referencedRelation: "plantillas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "auditorias_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "auditorias_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"comentarios": {
                  Row: {
                    "autor_id": string,"created_at": string,"entidad": Database["public"]['Enums']["entidad_comentario"],"entidad_id": string,"id": string,"interno": boolean,"proyecto_id": string,"texto": string
                  }
                  ComputedFields: never
                  Insert: {
                    "autor_id"?: string,"created_at"?: string,"entidad": Database["public"]['Enums']["entidad_comentario"],"entidad_id": string,"id"?: string,"interno"?: boolean,"proyecto_id": string,"texto": string
                  }
                  Update: {
                    "autor_id"?: string,"created_at"?: string,"entidad"?: Database["public"]['Enums']["entidad_comentario"],"entidad_id"?: string,"id"?: string,"interno"?: boolean,"proyecto_id"?: string,"texto"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comentarios_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comentarios_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comentarios_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"contactos": {
                  Row: {
                    "cargo": string | null,"created_at": string,"email": string | null,"id": string,"negocio_id": string,"nombre": string,"principal": boolean,"telefono": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cargo"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"negocio_id": string,"nombre": string,"principal"?: boolean,"telefono"?: string | null
                  }
                  Update: {
                    "cargo"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"negocio_id"?: string,"nombre"?: string,"principal"?: boolean,"telefono"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contactos_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    }
                  ]
                },"documento_versiones": {
                  Row: {
                    "created_at": string,"documento_id": string,"id": string,"storage_path": string,"subido_por": string | null,"tamano": number | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"documento_id": string,"id"?: string,"storage_path": string,"subido_por"?: string | null,"tamano"?: number | null,"version": number
                  }
                  Update: {
                    "created_at"?: string,"documento_id"?: string,"id"?: string,"storage_path"?: string,"subido_por"?: string | null,"tamano"?: number | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "documento_versiones_documento_id_fkey"
      columns: ["documento_id"]
isOneToOne: false
      referencedRelation: "documentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documento_versiones_subido_por_fkey"
      columns: ["subido_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"documentos": {
                  Row: {
                    "carpeta": string,"created_at": string,"id": string,"mime": string | null,"negocio_id": string | null,"nombre": string,"organizacion_id": string,"proyecto_id": string | null,"storage_path": string,"subido_por": string | null,"tamano": number | null,"updated_at": string,"version": number,"visible_cliente": boolean,"puede_editar_documento": boolean | null,"puede_ver_documento": boolean | null
                  }
                  ComputedFields: "puede_editar_documento" | "puede_ver_documento"
                  Insert: {
                    "carpeta"?: string,"created_at"?: string,"id"?: string,"mime"?: string | null,"negocio_id"?: string | null,"nombre": string,"organizacion_id": string,"proyecto_id"?: string | null,"storage_path": string,"subido_por"?: string | null,"tamano"?: number | null,"updated_at"?: string,"version"?: number,"visible_cliente"?: boolean
                  }
                  Update: {
                    "carpeta"?: string,"created_at"?: string,"id"?: string,"mime"?: string | null,"negocio_id"?: string | null,"nombre"?: string,"organizacion_id"?: string,"proyecto_id"?: string | null,"storage_path"?: string,"subido_por"?: string | null,"tamano"?: number | null,"updated_at"?: string,"version"?: number,"visible_cliente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "documentos_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documentos_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documentos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documentos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documentos_subido_por_fkey"
      columns: ["subido_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"eventos": {
                  Row: {
                    "creado_por": string | null,"created_at": string,"fin": string | null,"id": string,"inicio": string,"lugar": string | null,"notas": string | null,"organizacion_id": string,"proyecto_id": string | null,"tipo": Database["public"]['Enums']["tipo_evento"],"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_por"?: string | null,"created_at"?: string,"fin"?: string | null,"id"?: string,"inicio": string,"lugar"?: string | null,"notas"?: string | null,"organizacion_id": string,"proyecto_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_evento"],"titulo": string
                  }
                  Update: {
                    "creado_por"?: string | null,"created_at"?: string,"fin"?: string | null,"id"?: string,"inicio"?: string,"lugar"?: string | null,"notas"?: string | null,"organizacion_id"?: string,"proyecto_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_evento"],"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "eventos_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "eventos_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "eventos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "eventos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"fases": {
                  Row: {
                    "estado": Database["public"]['Enums']["estado_fase"],"fecha_fin": string | null,"fecha_inicio": string | null,"id": string,"nombre": string,"orden": number,"proyecto_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "estado"?: Database["public"]['Enums']["estado_fase"],"fecha_fin"?: string | null,"fecha_inicio"?: string | null,"id"?: string,"nombre": string,"orden"?: number,"proyecto_id": string
                  }
                  Update: {
                    "estado"?: Database["public"]['Enums']["estado_fase"],"fecha_fin"?: string | null,"fecha_inicio"?: string | null,"id"?: string,"nombre"?: string,"orden"?: number,"proyecto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fases_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fases_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"hallazgos": {
                  Row: {
                    "area": Database["public"]['Enums']["area_auditoria"] | null,"auditoria_id": string | null,"coste_estimado": number | null,"creado_por": string | null,"created_at": string,"dafo": Database["public"]['Enums']["tipo_dafo"] | null,"descripcion": string | null,"esfuerzo": number,"fotos": (string)[],"id": string,"impacto": number,"muda": Database["public"]['Enums']["tipo_muda"] | null,"proyecto_id": string,"tipo": Database["public"]['Enums']["tipo_hallazgo"],"titulo": string,"visible_cliente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "area"?: Database["public"]['Enums']["area_auditoria"] | null,"auditoria_id"?: string | null,"coste_estimado"?: number | null,"creado_por"?: string | null,"created_at"?: string,"dafo"?: Database["public"]['Enums']["tipo_dafo"] | null,"descripcion"?: string | null,"esfuerzo"?: number,"fotos"?: (string)[],"id"?: string,"impacto"?: number,"muda"?: Database["public"]['Enums']["tipo_muda"] | null,"proyecto_id": string,"tipo": Database["public"]['Enums']["tipo_hallazgo"],"titulo": string,"visible_cliente"?: boolean
                  }
                  Update: {
                    "area"?: Database["public"]['Enums']["area_auditoria"] | null,"auditoria_id"?: string | null,"coste_estimado"?: number | null,"creado_por"?: string | null,"created_at"?: string,"dafo"?: Database["public"]['Enums']["tipo_dafo"] | null,"descripcion"?: string | null,"esfuerzo"?: number,"fotos"?: (string)[],"id"?: string,"impacto"?: number,"muda"?: Database["public"]['Enums']["tipo_muda"] | null,"proyecto_id"?: string,"tipo"?: Database["public"]['Enums']["tipo_hallazgo"],"titulo"?: string,"visible_cliente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "hallazgos_auditoria_id_fkey"
      columns: ["auditoria_id"]
isOneToOne: false
      referencedRelation: "auditorias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hallazgos_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hallazgos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hallazgos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"hitos": {
                  Row: {
                    "completado": boolean,"fase_id": string | null,"fecha": string | null,"id": string,"proyecto_id": string,"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completado"?: boolean,"fase_id"?: string | null,"fecha"?: string | null,"id"?: string,"proyecto_id": string,"titulo": string
                  }
                  Update: {
                    "completado"?: boolean,"fase_id"?: string | null,"fecha"?: string | null,"id"?: string,"proyecto_id"?: string,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hitos_fase_id_fkey"
      columns: ["fase_id"]
isOneToOne: false
      referencedRelation: "fases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hitos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hitos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"kpi_valores": {
                  Row: {
                    "fuente": string,"id": string,"kpi_id": string,"nota": string | null,"periodo": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "fuente"?: string,"id"?: string,"kpi_id": string,"nota"?: string | null,"periodo": string,"valor": number
                  }
                  Update: {
                    "fuente"?: string,"id"?: string,"kpi_id"?: string,"nota"?: string | null,"periodo"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "kpi_valores_kpi_id_fkey"
      columns: ["kpi_id"]
isOneToOne: false
      referencedRelation: "kpis"
      referencedColumns: ["id"]
    }
                  ]
                },"kpis": {
                  Row: {
                    "codigo": string | null,"created_at": string,"id": string,"nombre": string,"objetivo": number | null,"proyecto_id": string,"sentido": Database["public"]['Enums']["sentido_kpi"],"unidad": string,"valor_base": number | null,"visible_cliente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "codigo"?: string | null,"created_at"?: string,"id"?: string,"nombre": string,"objetivo"?: number | null,"proyecto_id": string,"sentido"?: Database["public"]['Enums']["sentido_kpi"],"unidad"?: string,"valor_base"?: number | null,"visible_cliente"?: boolean
                  }
                  Update: {
                    "codigo"?: string | null,"created_at"?: string,"id"?: string,"nombre"?: string,"objetivo"?: number | null,"proyecto_id"?: string,"sentido"?: Database["public"]['Enums']["sentido_kpi"],"unidad"?: string,"valor_base"?: number | null,"visible_cliente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "kpis_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kpis_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"negocios": {
                  Row: {
                    "aforo": number | null,"created_at": string,"direccion": string | null,"food_cost_objetivo": number,"grupo": string | null,"horarios": string | null,"id": string,"localidad": string | null,"nombre": string,"notas": string | null,"organizacion_id": string,"plantilla": number | null,"provincia": string | null,"ticket_medio": number | null,"tipo": Database["public"]['Enums']["tipo_negocio"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aforo"?: number | null,"created_at"?: string,"direccion"?: string | null,"food_cost_objetivo"?: number,"grupo"?: string | null,"horarios"?: string | null,"id"?: string,"localidad"?: string | null,"nombre": string,"notas"?: string | null,"organizacion_id": string,"plantilla"?: number | null,"provincia"?: string | null,"ticket_medio"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_negocio"],"updated_at"?: string
                  }
                  Update: {
                    "aforo"?: number | null,"created_at"?: string,"direccion"?: string | null,"food_cost_objetivo"?: number,"grupo"?: string | null,"horarios"?: string | null,"id"?: string,"localidad"?: string | null,"nombre"?: string,"notas"?: string | null,"organizacion_id"?: string,"plantilla"?: number | null,"provincia"?: string | null,"ticket_medio"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_negocio"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "negocios_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    }
                  ]
                },"organizaciones": {
                  Row: {
                    "ajustes": NonNullable<Json>,"created_at": string,"id": string,"logo_path": string | null,"nombre": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ajustes"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"logo_path"?: string | null,"nombre": string
                  }
                  Update: {
                    "ajustes"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"logo_path"?: string | null,"nombre"?: string
                  }
                  Relationships: [
                    
                  ]
                },"perfiles": {
                  Row: {
                    "created_at": string,"email": string | null,"id": string,"nombre": string,"organizacion_id": string,"rol": Database["public"]['Enums']["rol_global"],"tarifa_hora": number | null,"telefono": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"id": string,"nombre"?: string,"organizacion_id": string,"rol"?: Database["public"]['Enums']["rol_global"],"tarifa_hora"?: number | null,"telefono"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"nombre"?: string,"organizacion_id"?: string,"rol"?: Database["public"]['Enums']["rol_global"],"tarifa_hora"?: number | null,"telefono"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "perfiles_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    }
                  ]
                },"plantillas": {
                  Row: {
                    "activa": boolean,"area": Database["public"]['Enums']["area_auditoria"] | null,"contenido": NonNullable<Json>,"created_at": string,"descripcion": string | null,"id": string,"nombre": string,"organizacion_id": string,"tipo": Database["public"]['Enums']["tipo_plantilla"],"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "activa"?: boolean,"area"?: Database["public"]['Enums']["area_auditoria"] | null,"contenido"?: NonNullable<Json>,"created_at"?: string,"descripcion"?: string | null,"id"?: string,"nombre": string,"organizacion_id": string,"tipo"?: Database["public"]['Enums']["tipo_plantilla"],"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "activa"?: boolean,"area"?: Database["public"]['Enums']["area_auditoria"] | null,"contenido"?: NonNullable<Json>,"created_at"?: string,"descripcion"?: string | null,"id"?: string,"nombre"?: string,"organizacion_id"?: string,"tipo"?: Database["public"]['Enums']["tipo_plantilla"],"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "plantillas_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    }
                  ]
                },"proyecto_finanzas": {
                  Row: {
                    "horas_consumidas": number,"horas_presupuestadas": number,"importe_presupuestado": number,"notas": string | null,"proyecto_id": string,"tarifa_hora": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "horas_consumidas"?: number,"horas_presupuestadas"?: number,"importe_presupuestado"?: number,"notas"?: string | null,"proyecto_id": string,"tarifa_hora"?: number | null
                  }
                  Update: {
                    "horas_consumidas"?: number,"horas_presupuestadas"?: number,"importe_presupuestado"?: number,"notas"?: string | null,"proyecto_id"?: string,"tarifa_hora"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "proyecto_finanzas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: true
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyecto_finanzas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: true
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"proyecto_miembros": {
                  Row: {
                    "created_at": string,"proyecto_id": string,"rol": Database["public"]['Enums']["rol_proyecto"],"usuario_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"proyecto_id": string,"rol": Database["public"]['Enums']["rol_proyecto"],"usuario_id": string
                  }
                  Update: {
                    "created_at"?: string,"proyecto_id"?: string,"rol"?: Database["public"]['Enums']["rol_proyecto"],"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "proyecto_miembros_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyecto_miembros_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyecto_miembros_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"proyectos": {
                  Row: {
                    "alcance": string | null,"codigo": string | null,"created_at": string,"estado": Database["public"]['Enums']["estado_proyecto"],"fecha_fin": string | null,"fecha_inicio": string | null,"id": string,"negocio_id": string,"objetivos": string | null,"organizacion_id": string,"responsable_id": string | null,"salud": Database["public"]['Enums']["salud_proyecto"],"tipo": string,"titulo": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alcance"?: string | null,"codigo"?: string | null,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_proyecto"],"fecha_fin"?: string | null,"fecha_inicio"?: string | null,"id"?: string,"negocio_id": string,"objetivos"?: string | null,"organizacion_id": string,"responsable_id"?: string | null,"salud"?: Database["public"]['Enums']["salud_proyecto"],"tipo"?: string,"titulo": string,"updated_at"?: string
                  }
                  Update: {
                    "alcance"?: string | null,"codigo"?: string | null,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_proyecto"],"fecha_fin"?: string | null,"fecha_inicio"?: string | null,"id"?: string,"negocio_id"?: string,"objetivos"?: string | null,"organizacion_id"?: string,"responsable_id"?: string | null,"salud"?: Database["public"]['Enums']["salud_proyecto"],"tipo"?: string,"titulo"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "proyectos_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyectos_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyectos_responsable_id_fkey"
      columns: ["responsable_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tareas": {
                  Row: {
                    "accion_id": string | null,"completada_at": string | null,"created_at": string,"descripcion": string | null,"estado": Database["public"]['Enums']["estado_tarea"],"id": string,"orden": number,"prioridad": Database["public"]['Enums']["prioridad"],"proyecto_id": string,"responsable_id": string | null,"titulo": string,"updated_at": string,"vence": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accion_id"?: string | null,"completada_at"?: string | null,"created_at"?: string,"descripcion"?: string | null,"estado"?: Database["public"]['Enums']["estado_tarea"],"id"?: string,"orden"?: number,"prioridad"?: Database["public"]['Enums']["prioridad"],"proyecto_id": string,"responsable_id"?: string | null,"titulo": string,"updated_at"?: string,"vence"?: string | null
                  }
                  Update: {
                    "accion_id"?: string | null,"completada_at"?: string | null,"created_at"?: string,"descripcion"?: string | null,"estado"?: Database["public"]['Enums']["estado_tarea"],"id"?: string,"orden"?: number,"prioridad"?: Database["public"]['Enums']["prioridad"],"proyecto_id"?: string,"responsable_id"?: string | null,"titulo"?: string,"updated_at"?: string,"vence"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tareas_accion_id_fkey"
      columns: ["accion_id"]
isOneToOne: false
      referencedRelation: "acciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tareas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tareas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tareas_responsable_id_fkey"
      columns: ["responsable_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_proyectos_resumen": {
                  Row: {
                    "codigo": string | null,"estado": Database["public"]['Enums']["estado_proyecto"],"fase_actual": string | null,"fecha_fin": string | null,"fecha_inicio": string | null,"id": string,"negocio_id": string,"negocio_localidad": string | null,"negocio_nombre": string,"responsable_id": string | null,"salud": Database["public"]['Enums']["salud_proyecto"],"tareas_hechas": number | null,"tareas_total": number | null,"tareas_vencidas": number | null,"tipo": string,"titulo": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "proyectos_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyectos_responsable_id_fkey"
      columns: ["responsable_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "comparte_proyecto":
{ Args: { "u": string }; Returns: boolean
                           },
"es_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"es_equipo":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mi_org":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"mi_rol":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["rol_global"]
                           },
"puede_editar_documento":
{ Args: { "d": Omit<Database["public"]['Tables']["documentos"]['Row'], Database["public"]['Tables']["documentos"]['ComputedFields']> }; Returns: boolean
                           },
"puede_editar_negocio":
{ Args: { "n": string }; Returns: boolean
                           },
"puede_editar_proyecto":
{ Args: { "p": string }; Returns: boolean
                           },
"puede_ver_documento":
{ Args: { "d": Omit<Database["public"]['Tables']["documentos"]['Row'], Database["public"]['Tables']["documentos"]['ComputedFields']> }; Returns: boolean
                           },
"puede_ver_negocio":
{ Args: { "n": string }; Returns: boolean
                           },
"puede_ver_proyecto":
{ Args: { "p": string }; Returns: boolean
                           },
"recalcular_puntuacion":
{ Args: { "a": string }; Returns: number
                           },
"rol_en_proyecto":
{ Args: { "p": string }; Returns: Database["public"]['Enums']["rol_proyecto"]
                           },
"storage_puede_subir":
{ Args: { "nombre": string }; Returns: boolean
                           },
"storage_puede_ver":
{ Args: { "nombre": string }; Returns: boolean
                           }
          }
          Enums: {
            "area_auditoria": "sala"|"cocina"|"compras"|"almacen"|"carta"|"equipo"|"experiencia_cliente"|"appcc","entidad_comentario": "tarea"|"documento"|"accion"|"hallazgo"|"acta","estado_auditoria": "borrador"|"completada","estado_fase": "pendiente"|"en_curso"|"completada","estado_proyecto": "diagnostico"|"en_curso"|"seguimiento"|"cerrado","estado_tarea": "pendiente"|"en_curso"|"bloqueada"|"hecha","fase_pdca": "planificar"|"hacer"|"verificar"|"actuar","prioridad": "baja"|"media"|"alta","rol_global": "admin"|"colaborador"|"cliente"|"personal","rol_proyecto": "consultor"|"colaborador"|"cliente"|"personal","salud_proyecto": "verde"|"ambar"|"rojo","sentido_kpi": "subir"|"bajar","tipo_dafo": "debilidad"|"amenaza"|"fortaleza"|"oportunidad","tipo_evento": "visita"|"auditoria"|"entrega"|"reunion"|"formacion","tipo_hallazgo": "muda"|"dafo"|"observacion","tipo_muda": "sobreproduccion"|"esperas"|"transporte"|"sobreprocesos"|"inventario"|"movimientos"|"defectos_mermas","tipo_negocio": "restaurante"|"bar"|"cafeteria"|"dark_kitchen"|"hotel"|"grupo"|"catering"|"otro","tipo_plantilla": "auditoria"|"sop"|"checklist"|"informe"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "area_auditoria": ["sala", "cocina", "compras", "almacen", "carta", "equipo", "experiencia_cliente", "appcc"],"entidad_comentario": ["tarea", "documento", "accion", "hallazgo", "acta"],"estado_auditoria": ["borrador", "completada"],"estado_fase": ["pendiente", "en_curso", "completada"],"estado_proyecto": ["diagnostico", "en_curso", "seguimiento", "cerrado"],"estado_tarea": ["pendiente", "en_curso", "bloqueada", "hecha"],"fase_pdca": ["planificar", "hacer", "verificar", "actuar"],"prioridad": ["baja", "media", "alta"],"rol_global": ["admin", "colaborador", "cliente", "personal"],"rol_proyecto": ["consultor", "colaborador", "cliente", "personal"],"salud_proyecto": ["verde", "ambar", "rojo"],"sentido_kpi": ["subir", "bajar"],"tipo_dafo": ["debilidad", "amenaza", "fortaleza", "oportunidad"],"tipo_evento": ["visita", "auditoria", "entrega", "reunion", "formacion"],"tipo_hallazgo": ["muda", "dafo", "observacion"],"tipo_muda": ["sobreproduccion", "esperas", "transporte", "sobreprocesos", "inventario", "movimientos", "defectos_mermas"],"tipo_negocio": ["restaurante", "bar", "cafeteria", "dark_kitchen", "hotel", "grupo", "catering", "otro"],"tipo_plantilla": ["auditoria", "sop", "checklist", "informe"]
          }
        }
} as const
