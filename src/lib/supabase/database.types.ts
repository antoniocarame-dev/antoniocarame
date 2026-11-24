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
                    "created_at": string,"descripcion": string | null,"fase_pdca": Database["public"]['Enums']["fase_pdca"],"fecha_objetivo": string | null,"hallazgo_id": string | null,"id": string,"kpi_id": string | null,"prioridad": Database["public"]['Enums']["prioridad"],"proyecto_id": string,"responsable_externo": string | null,"responsable_id": string | null,"resultado": string | null,"titulo": string,"updated_at": string,"visible_cliente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"descripcion"?: string | null,"fase_pdca"?: Database["public"]['Enums']["fase_pdca"],"fecha_objetivo"?: string | null,"hallazgo_id"?: string | null,"id"?: string,"kpi_id"?: string | null,"prioridad"?: Database["public"]['Enums']["prioridad"],"proyecto_id": string,"responsable_externo"?: string | null,"responsable_id"?: string | null,"resultado"?: string | null,"titulo": string,"updated_at"?: string,"visible_cliente"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"descripcion"?: string | null,"fase_pdca"?: Database["public"]['Enums']["fase_pdca"],"fecha_objetivo"?: string | null,"hallazgo_id"?: string | null,"id"?: string,"kpi_id"?: string | null,"prioridad"?: Database["public"]['Enums']["prioridad"],"proyecto_id"?: string,"responsable_externo"?: string | null,"responsable_id"?: string | null,"resultado"?: string | null,"titulo"?: string,"updated_at"?: string,"visible_cliente"?: boolean
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
                },"cuentas_resultados": {
                  Row: {
                    "alquiler": number | null,"coste_mp": number | null,"negocio_id": string,"notas": string | null,"otros_gastos": number | null,"periodo": string,"personal": number | null,"suministros": number | null,"updated_at": string,"ventas_netas": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alquiler"?: number | null,"coste_mp"?: number | null,"negocio_id": string,"notas"?: string | null,"otros_gastos"?: number | null,"periodo": string,"personal"?: number | null,"suministros"?: number | null,"updated_at"?: string,"ventas_netas"?: number | null
                  }
                  Update: {
                    "alquiler"?: number | null,"coste_mp"?: number | null,"negocio_id"?: string,"notas"?: string | null,"otros_gastos"?: number | null,"periodo"?: string,"personal"?: number | null,"suministros"?: number | null,"updated_at"?: string,"ventas_netas"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "cuentas_resultados_negocio_id_fkey"
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
                },"escandallos": {
                  Row: {
                    "activo": boolean,"categoria": string | null,"created_at": string,"elaboracion": string | null,"id": string,"iva_pct": number,"negocio_id": string,"nombre": string,"pvp": number | null,"raciones": number,"rendimiento": number | null,"tipo": Database["public"]['Enums']["tipo_escandallo"],"unidad_rendimiento": Database["public"]['Enums']["unidad_compra"] | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"categoria"?: string | null,"created_at"?: string,"elaboracion"?: string | null,"id"?: string,"iva_pct"?: number,"negocio_id": string,"nombre": string,"pvp"?: number | null,"raciones"?: number,"rendimiento"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_escandallo"],"unidad_rendimiento"?: Database["public"]['Enums']["unidad_compra"] | null,"updated_at"?: string
                  }
                  Update: {
                    "activo"?: boolean,"categoria"?: string | null,"created_at"?: string,"elaboracion"?: string | null,"id"?: string,"iva_pct"?: number,"negocio_id"?: string,"nombre"?: string,"pvp"?: number | null,"raciones"?: number,"rendimiento"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_escandallo"],"unidad_rendimiento"?: Database["public"]['Enums']["unidad_compra"] | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "escandallos_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    }
                  ]
                },"estandares": {
                  Row: {
                    "area": Database["public"]['Enums']["area_auditoria"] | null,"contenido": NonNullable<Json>,"created_at": string,"estado": Database["public"]['Enums']["estado_estandar"],"fecha_implantacion": string | null,"id": string,"plantilla_id": string | null,"proyecto_id": string,"responsable_externo": string | null,"tipo": Database["public"]['Enums']["tipo_estandar"],"titulo": string,"updated_at": string,"version": number,"visible_cliente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "area"?: Database["public"]['Enums']["area_auditoria"] | null,"contenido"?: NonNullable<Json>,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_estandar"],"fecha_implantacion"?: string | null,"id"?: string,"plantilla_id"?: string | null,"proyecto_id": string,"responsable_externo"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_estandar"],"titulo": string,"updated_at"?: string,"version"?: number,"visible_cliente"?: boolean
                  }
                  Update: {
                    "area"?: Database["public"]['Enums']["area_auditoria"] | null,"contenido"?: NonNullable<Json>,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_estandar"],"fecha_implantacion"?: string | null,"id"?: string,"plantilla_id"?: string | null,"proyecto_id"?: string,"responsable_externo"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_estandar"],"titulo"?: string,"updated_at"?: string,"version"?: number,"visible_cliente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "estandares_plantilla_id_fkey"
      columns: ["plantilla_id"]
isOneToOne: false
      referencedRelation: "plantillas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "estandares_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "estandares_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"eventos": {
                  Row: {
                    "creado_por": string | null,"created_at": string,"fin": string | null,"id": string,"inicio": string,"lugar": string | null,"notas": string | null,"organizacion_id": string,"proyecto_id": string | null,"tipo": Database["public"]['Enums']["tipo_evento"],"titulo": string,"todo_el_dia": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_por"?: string | null,"created_at"?: string,"fin"?: string | null,"id"?: string,"inicio": string,"lugar"?: string | null,"notas"?: string | null,"organizacion_id": string,"proyecto_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_evento"],"titulo": string,"todo_el_dia"?: boolean
                  }
                  Update: {
                    "creado_por"?: string | null,"created_at"?: string,"fin"?: string | null,"id"?: string,"inicio"?: string,"lugar"?: string | null,"notas"?: string | null,"organizacion_id"?: string,"proyecto_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_evento"],"titulo"?: string,"todo_el_dia"?: boolean
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
                },"facturas": {
                  Row: {
                    "archivo_path": string | null,"base": number | null,"created_at": string,"estado": Database["public"]['Enums']["estado_factura"],"extraccion": Json | null,"fecha": string | null,"id": string,"iva": number | null,"negocio_id": string,"notas": string | null,"numero": string | null,"proveedor_id": string | null,"tipo": Database["public"]['Enums']["tipo_documento_compra"],"total": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archivo_path"?: string | null,"base"?: number | null,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_factura"],"extraccion"?: Json | null,"fecha"?: string | null,"id"?: string,"iva"?: number | null,"negocio_id": string,"notas"?: string | null,"numero"?: string | null,"proveedor_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_documento_compra"],"total"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "archivo_path"?: string | null,"base"?: number | null,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_factura"],"extraccion"?: Json | null,"fecha"?: string | null,"id"?: string,"iva"?: number | null,"negocio_id"?: string,"notas"?: string | null,"numero"?: string | null,"proveedor_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_documento_compra"],"total"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "facturas_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "facturas_proveedor_id_fkey"
      columns: ["proveedor_id"]
isOneToOne: false
      referencedRelation: "proveedores"
      referencedColumns: ["id"]
    }
                  ]
                },"facturas_emitidas": {
                  Row: {
                    "base": number,"cliente_nombre": string | null,"concepto": string | null,"created_at": string,"estado": Database["public"]['Enums']["estado_cobro"],"fecha": string,"fecha_cobro": string | null,"id": string,"irpf_pct": number,"iva_pct": number,"negocio_id": string | null,"numero": string,"organizacion_id": string,"presupuesto_id": string | null,"proyecto_id": string | null,"vencimiento": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "base": number,"cliente_nombre"?: string | null,"concepto"?: string | null,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_cobro"],"fecha"?: string,"fecha_cobro"?: string | null,"id"?: string,"irpf_pct"?: number,"iva_pct"?: number,"negocio_id"?: string | null,"numero": string,"organizacion_id": string,"presupuesto_id"?: string | null,"proyecto_id"?: string | null,"vencimiento"?: string | null
                  }
                  Update: {
                    "base"?: number,"cliente_nombre"?: string | null,"concepto"?: string | null,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_cobro"],"fecha"?: string,"fecha_cobro"?: string | null,"id"?: string,"irpf_pct"?: number,"iva_pct"?: number,"negocio_id"?: string | null,"numero"?: string,"organizacion_id"?: string,"presupuesto_id"?: string | null,"proyecto_id"?: string | null,"vencimiento"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "facturas_emitidas_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "facturas_emitidas_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "facturas_emitidas_presupuesto_id_fkey"
      columns: ["presupuesto_id"]
isOneToOne: false
      referencedRelation: "presupuestos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "facturas_emitidas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "facturas_emitidas_proyecto_id_fkey"
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
                },"formaciones": {
                  Row: {
                    "asistentes": NonNullable<Json>,"contenido": string | null,"created_at": string,"duracion_h": number,"estandar_id": string | null,"fecha": string,"formador": string | null,"id": string,"proyecto_id": string,"titulo": string,"valoracion": number | null,"visible_cliente": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "asistentes"?: NonNullable<Json>,"contenido"?: string | null,"created_at"?: string,"duracion_h"?: number,"estandar_id"?: string | null,"fecha"?: string,"formador"?: string | null,"id"?: string,"proyecto_id": string,"titulo": string,"valoracion"?: number | null,"visible_cliente"?: boolean
                  }
                  Update: {
                    "asistentes"?: NonNullable<Json>,"contenido"?: string | null,"created_at"?: string,"duracion_h"?: number,"estandar_id"?: string | null,"fecha"?: string,"formador"?: string | null,"id"?: string,"proyecto_id"?: string,"titulo"?: string,"valoracion"?: number | null,"visible_cliente"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "formaciones_estandar_id_fkey"
      columns: ["estandar_id"]
isOneToOne: false
      referencedRelation: "estandares"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formaciones_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "formaciones_proyecto_id_fkey"
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
                },"horas": {
                  Row: {
                    "created_at": string,"descripcion": string | null,"fecha": string,"horas": number,"id": string,"km": number | null,"organizacion_id": string,"proyecto_id": string | null,"tipo": Database["public"]['Enums']["tipo_hora"],"usuario_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"descripcion"?: string | null,"fecha"?: string,"horas": number,"id"?: string,"km"?: number | null,"organizacion_id": string,"proyecto_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_hora"],"usuario_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"descripcion"?: string | null,"fecha"?: string,"horas"?: number,"id"?: string,"km"?: number | null,"organizacion_id"?: string,"proyecto_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_hora"],"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "horas_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "horas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "horas_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "horas_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"informes": {
                  Row: {
                    "conclusiones": string | null,"created_at": string,"enviado_a": string | null,"enviado_at": string | null,"estado": Database["public"]['Enums']["estado_informe"],"id": string,"introduccion": string | null,"periodo_desde": string | null,"periodo_hasta": string | null,"proximos_pasos": string | null,"proyecto_id": string,"secciones": (string)[],"tipo": Database["public"]['Enums']["tipo_informe"],"titulo": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "conclusiones"?: string | null,"created_at"?: string,"enviado_a"?: string | null,"enviado_at"?: string | null,"estado"?: Database["public"]['Enums']["estado_informe"],"id"?: string,"introduccion"?: string | null,"periodo_desde"?: string | null,"periodo_hasta"?: string | null,"proximos_pasos"?: string | null,"proyecto_id": string,"secciones"?: (string)[],"tipo"?: Database["public"]['Enums']["tipo_informe"],"titulo": string,"updated_at"?: string
                  }
                  Update: {
                    "conclusiones"?: string | null,"created_at"?: string,"enviado_a"?: string | null,"enviado_at"?: string | null,"estado"?: Database["public"]['Enums']["estado_informe"],"id"?: string,"introduccion"?: string | null,"periodo_desde"?: string | null,"periodo_hasta"?: string | null,"proximos_pasos"?: string | null,"proyecto_id"?: string,"secciones"?: (string)[],"tipo"?: Database["public"]['Enums']["tipo_informe"],"titulo"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "informes_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "informes_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"ingredientes_escandallo": {
                  Row: {
                    "cantidad": number,"escandallo_id": string,"id": string,"merma_pct": number | null,"orden": number,"producto_id": string | null,"sub_escandallo_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad": number,"escandallo_id": string,"id"?: string,"merma_pct"?: number | null,"orden"?: number,"producto_id"?: string | null,"sub_escandallo_id"?: string | null
                  }
                  Update: {
                    "cantidad"?: number,"escandallo_id"?: string,"id"?: string,"merma_pct"?: number | null,"orden"?: number,"producto_id"?: string | null,"sub_escandallo_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredientes_escandallo_escandallo_id_fkey"
      columns: ["escandallo_id"]
isOneToOne: false
      referencedRelation: "escandallos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ingredientes_escandallo_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ingredientes_escandallo_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "v_productos_precio"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ingredientes_escandallo_sub_escandallo_id_fkey"
      columns: ["sub_escandallo_id"]
isOneToOne: false
      referencedRelation: "escandallos"
      referencedColumns: ["id"]
    }
                  ]
                },"inventario_lineas": {
                  Row: {
                    "cantidad": number | null,"inventario_id": string,"precio": number | null,"producto_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad"?: number | null,"inventario_id": string,"precio"?: number | null,"producto_id": string
                  }
                  Update: {
                    "cantidad"?: number | null,"inventario_id"?: string,"precio"?: number | null,"producto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventario_lineas_inventario_id_fkey"
      columns: ["inventario_id"]
isOneToOne: false
      referencedRelation: "inventarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_lineas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_lineas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "v_productos_precio"
      referencedColumns: ["id"]
    }
                  ]
                },"inventarios": {
                  Row: {
                    "created_at": string,"estado": Database["public"]['Enums']["estado_inventario"],"fecha": string,"id": string,"negocio_id": string,"nombre": string,"notas": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"estado"?: Database["public"]['Enums']["estado_inventario"],"fecha"?: string,"id"?: string,"negocio_id": string,"nombre": string,"notas"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"estado"?: Database["public"]['Enums']["estado_inventario"],"fecha"?: string,"id"?: string,"negocio_id"?: string,"nombre"?: string,"notas"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventarios_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
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
                },"lineas_factura": {
                  Row: {
                    "cantidad": number,"descripcion": string,"descuento_pct": number,"factura_id": string,"id": string,"importe": number | null,"iva_pct": number | null,"orden": number,"precio_unitario": number,"producto_id": string | null,"unidad": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad"?: number,"descripcion": string,"descuento_pct"?: number,"factura_id": string,"id"?: string,"importe"?: number | null,"iva_pct"?: number | null,"orden"?: number,"precio_unitario"?: number,"producto_id"?: string | null,"unidad"?: string | null
                  }
                  Update: {
                    "cantidad"?: number,"descripcion"?: string,"descuento_pct"?: number,"factura_id"?: string,"id"?: string,"importe"?: number | null,"iva_pct"?: number | null,"orden"?: number,"precio_unitario"?: number,"producto_id"?: string | null,"unidad"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lineas_factura_factura_id_fkey"
      columns: ["factura_id"]
isOneToOne: false
      referencedRelation: "facturas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lineas_factura_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lineas_factura_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "v_productos_precio"
      referencedColumns: ["id"]
    }
                  ]
                },"mermas": {
                  Row: {
                    "cantidad": number,"coste": number,"created_at": string,"escandallo_id": string | null,"fecha": string,"id": string,"motivo": Database["public"]['Enums']["motivo_merma"],"negocio_id": string,"notas": string | null,"producto_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad": number,"coste"?: number,"created_at"?: string,"escandallo_id"?: string | null,"fecha"?: string,"id"?: string,"motivo"?: Database["public"]['Enums']["motivo_merma"],"negocio_id": string,"notas"?: string | null,"producto_id"?: string | null
                  }
                  Update: {
                    "cantidad"?: number,"coste"?: number,"created_at"?: string,"escandallo_id"?: string | null,"fecha"?: string,"id"?: string,"motivo"?: Database["public"]['Enums']["motivo_merma"],"negocio_id"?: string,"notas"?: string | null,"producto_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "mermas_escandallo_id_fkey"
      columns: ["escandallo_id"]
isOneToOne: false
      referencedRelation: "escandallos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mermas_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mermas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mermas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "v_productos_precio"
      referencedColumns: ["id"]
    }
                  ]
                },"negocios": {
                  Row: {
                    "aforo": number | null,"created_at": string,"direccion": string | null,"food_cost_objetivo": number,"grupo": string | null,"horarios": string | null,"horas_apertura_dia": number,"id": string,"localidad": string | null,"nombre": string,"notas": string | null,"organizacion_id": string,"plantilla": number | null,"provincia": string | null,"servicios_dia": number,"ticket_medio": number | null,"tipo": Database["public"]['Enums']["tipo_negocio"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aforo"?: number | null,"created_at"?: string,"direccion"?: string | null,"food_cost_objetivo"?: number,"grupo"?: string | null,"horarios"?: string | null,"horas_apertura_dia"?: number,"id"?: string,"localidad"?: string | null,"nombre": string,"notas"?: string | null,"organizacion_id": string,"plantilla"?: number | null,"provincia"?: string | null,"servicios_dia"?: number,"ticket_medio"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_negocio"],"updated_at"?: string
                  }
                  Update: {
                    "aforo"?: number | null,"created_at"?: string,"direccion"?: string | null,"food_cost_objetivo"?: number,"grupo"?: string | null,"horarios"?: string | null,"horas_apertura_dia"?: number,"id"?: string,"localidad"?: string | null,"nombre"?: string,"notas"?: string | null,"organizacion_id"?: string,"plantilla"?: number | null,"provincia"?: string | null,"servicios_dia"?: number,"ticket_medio"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_negocio"],"updated_at"?: string
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
                },"precios": {
                  Row: {
                    "cantidad": number | null,"created_at": string,"fecha": string,"id": string,"linea_factura_id": string | null,"precio": number,"producto_id": string,"proveedor_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad"?: number | null,"created_at"?: string,"fecha": string,"id"?: string,"linea_factura_id"?: string | null,"precio": number,"producto_id": string,"proveedor_id"?: string | null
                  }
                  Update: {
                    "cantidad"?: number | null,"created_at"?: string,"fecha"?: string,"id"?: string,"linea_factura_id"?: string | null,"precio"?: number,"producto_id"?: string,"proveedor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "precios_linea_factura_id_fkey"
      columns: ["linea_factura_id"]
isOneToOne: false
      referencedRelation: "lineas_factura"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "precios_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "precios_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "v_productos_precio"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "precios_proveedor_id_fkey"
      columns: ["proveedor_id"]
isOneToOne: false
      referencedRelation: "proveedores"
      referencedColumns: ["id"]
    }
                  ]
                },"presupuestos": {
                  Row: {
                    "conceptos": NonNullable<Json>,"condiciones": string | null,"created_at": string,"estado": Database["public"]['Enums']["estado_presupuesto"],"fecha": string,"fecha_estado": string | null,"id": string,"introduccion": string | null,"irpf_pct": number,"iva_pct": number,"negocio_id": string,"notas": string | null,"numero": string,"organizacion_id": string,"proyecto_id": string | null,"titulo": string,"updated_at": string,"validez_dias": number
                  }
                  ComputedFields: never
                  Insert: {
                    "conceptos"?: NonNullable<Json>,"condiciones"?: string | null,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_presupuesto"],"fecha"?: string,"fecha_estado"?: string | null,"id"?: string,"introduccion"?: string | null,"irpf_pct"?: number,"iva_pct"?: number,"negocio_id": string,"notas"?: string | null,"numero": string,"organizacion_id": string,"proyecto_id"?: string | null,"titulo": string,"updated_at"?: string,"validez_dias"?: number
                  }
                  Update: {
                    "conceptos"?: NonNullable<Json>,"condiciones"?: string | null,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_presupuesto"],"fecha"?: string,"fecha_estado"?: string | null,"id"?: string,"introduccion"?: string | null,"irpf_pct"?: number,"iva_pct"?: number,"negocio_id"?: string,"notas"?: string | null,"numero"?: string,"organizacion_id"?: string,"proyecto_id"?: string | null,"titulo"?: string,"updated_at"?: string,"validez_dias"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "presupuestos_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "presupuestos_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "presupuestos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "presupuestos_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "v_proyectos_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"productos": {
                  Row: {
                    "activo": boolean,"alergenos": (string)[],"created_at": string,"familia": string,"formato": string | null,"id": string,"merma_pct": number,"negocio_id": string,"nombre": string,"proveedor_habitual_id": string | null,"unidad": Database["public"]['Enums']["unidad_compra"]
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"alergenos"?: (string)[],"created_at"?: string,"familia"?: string,"formato"?: string | null,"id"?: string,"merma_pct"?: number,"negocio_id": string,"nombre": string,"proveedor_habitual_id"?: string | null,"unidad"?: Database["public"]['Enums']["unidad_compra"]
                  }
                  Update: {
                    "activo"?: boolean,"alergenos"?: (string)[],"created_at"?: string,"familia"?: string,"formato"?: string | null,"id"?: string,"merma_pct"?: number,"negocio_id"?: string,"nombre"?: string,"proveedor_habitual_id"?: string | null,"unidad"?: Database["public"]['Enums']["unidad_compra"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "productos_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "productos_proveedor_habitual_id_fkey"
      columns: ["proveedor_habitual_id"]
isOneToOne: false
      referencedRelation: "proveedores"
      referencedColumns: ["id"]
    }
                  ]
                },"proveedores": {
                  Row: {
                    "categoria": string | null,"cif": string | null,"condiciones": string | null,"contacto": string | null,"created_at": string,"email": string | null,"id": string,"nombre": string,"organizacion_id": string,"telefono": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria"?: string | null,"cif"?: string | null,"condiciones"?: string | null,"contacto"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"nombre": string,"organizacion_id": string,"telefono"?: string | null
                  }
                  Update: {
                    "categoria"?: string | null,"cif"?: string | null,"condiciones"?: string | null,"contacto"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"nombre"?: string,"organizacion_id"?: string,"telefono"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "proveedores_organizacion_id_fkey"
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
                    "accion_id": string | null,"completada_at": string | null,"created_at": string,"descripcion": string | null,"estado": Database["public"]['Enums']["estado_tarea"],"id": string,"orden": number,"prioridad": Database["public"]['Enums']["prioridad"],"proyecto_id": string,"responsable_externo": string | null,"responsable_id": string | null,"titulo": string,"updated_at": string,"vence": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accion_id"?: string | null,"completada_at"?: string | null,"created_at"?: string,"descripcion"?: string | null,"estado"?: Database["public"]['Enums']["estado_tarea"],"id"?: string,"orden"?: number,"prioridad"?: Database["public"]['Enums']["prioridad"],"proyecto_id": string,"responsable_externo"?: string | null,"responsable_id"?: string | null,"titulo": string,"updated_at"?: string,"vence"?: string | null
                  }
                  Update: {
                    "accion_id"?: string | null,"completada_at"?: string | null,"created_at"?: string,"descripcion"?: string | null,"estado"?: Database["public"]['Enums']["estado_tarea"],"id"?: string,"orden"?: number,"prioridad"?: Database["public"]['Enums']["prioridad"],"proyecto_id"?: string,"responsable_externo"?: string | null,"responsable_id"?: string | null,"titulo"?: string,"updated_at"?: string,"vence"?: string | null
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
                },"ventas_diarias": {
                  Row: {
                    "cubiertos": number | null,"fecha": string,"fuente": string,"negocio_id": string,"tickets": number | null,"ventas_netas": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cubiertos"?: number | null,"fecha": string,"fuente"?: string,"negocio_id": string,"tickets"?: number | null,"ventas_netas": number
                  }
                  Update: {
                    "cubiertos"?: number | null,"fecha"?: string,"fuente"?: string,"negocio_id"?: string,"tickets"?: number | null,"ventas_netas"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "ventas_diarias_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    }
                  ]
                },"ventas_plato": {
                  Row: {
                    "escandallo_id": string,"periodo": string,"unidades": number
                  }
                  ComputedFields: never
                  Insert: {
                    "escandallo_id": string,"periodo": string,"unidades": number
                  }
                  Update: {
                    "escandallo_id"?: string,"periodo"?: string,"unidades"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "ventas_plato_escandallo_id_fkey"
      columns: ["escandallo_id"]
isOneToOne: false
      referencedRelation: "escandallos"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_productos_precio": {
                  Row: {
                    "activo": boolean,"alergenos": (string)[],"created_at": string,"familia": string,"fecha_precio": string | null,"fecha_precio_anterior": string | null,"formato": string | null,"id": string,"merma_pct": number,"negocio_id": string,"nombre": string,"precio_actual": number | null,"precio_anterior": number | null,"proveedor_habitual_id": string | null,"proveedor_ultimo_id": string | null,"unidad": Database["public"]['Enums']["unidad_compra"],"variacion_pct": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "precios_proveedor_id_fkey"
      columns: ["proveedor_ultimo_id"]
isOneToOne: false
      referencedRelation: "proveedores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "productos_negocio_id_fkey"
      columns: ["negocio_id"]
isOneToOne: false
      referencedRelation: "negocios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "productos_proveedor_habitual_id_fkey"
      columns: ["proveedor_habitual_id"]
isOneToOne: false
      referencedRelation: "proveedores"
      referencedColumns: ["id"]
    }
                  ]
                },"v_proyectos_resumen": {
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
            "cerrar_inventario":
{ Args: { "inv": string }; Returns: undefined
                           },
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
                           },
"validar_factura":
{ Args: { "f": string }; Returns: number
                           }
          }
          Enums: {
            "area_auditoria": "sala"|"cocina"|"compras"|"almacen"|"carta"|"equipo"|"experiencia_cliente"|"appcc","entidad_comentario": "tarea"|"documento"|"accion"|"hallazgo"|"acta","estado_auditoria": "borrador"|"completada","estado_cobro": "pendiente"|"cobrada","estado_estandar": "borrador"|"en_prueba"|"implantado","estado_factura": "pendiente"|"validada","estado_fase": "pendiente"|"en_curso"|"completada","estado_informe": "borrador"|"enviado","estado_inventario": "abierto"|"cerrado","estado_presupuesto": "borrador"|"enviado"|"aceptado"|"rechazado","estado_proyecto": "diagnostico"|"en_curso"|"seguimiento"|"cerrado","estado_tarea": "pendiente"|"en_curso"|"bloqueada"|"hecha","fase_pdca": "planificar"|"hacer"|"verificar"|"actuar","motivo_merma": "caducidad"|"deterioro"|"sobreproduccion"|"error_elaboracion"|"devolucion"|"rotura"|"otro","prioridad": "baja"|"media"|"alta","rol_global": "admin"|"colaborador"|"cliente"|"personal","rol_proyecto": "consultor"|"colaborador"|"cliente"|"personal","salud_proyecto": "verde"|"ambar"|"rojo","sentido_kpi": "subir"|"bajar","tipo_dafo": "debilidad"|"amenaza"|"fortaleza"|"oportunidad","tipo_documento_compra": "factura"|"albaran","tipo_escandallo": "plato"|"elaboracion","tipo_estandar": "sop"|"checklist"|"ficha"|"manual","tipo_evento": "visita"|"auditoria"|"entrega"|"reunion"|"formacion"|"personal"|"otro","tipo_hallazgo": "muda"|"dafo"|"observacion","tipo_hora": "visita"|"oficina"|"desplazamiento"|"formacion"|"reunion"|"otro","tipo_informe": "diagnostico"|"seguimiento"|"cierre","tipo_muda": "sobreproduccion"|"esperas"|"transporte"|"sobreprocesos"|"inventario"|"movimientos"|"defectos_mermas","tipo_negocio": "restaurante"|"bar"|"cafeteria"|"dark_kitchen"|"hotel"|"grupo"|"catering"|"otro","tipo_plantilla": "auditoria"|"sop"|"checklist"|"informe","unidad_compra": "kg"|"l"|"ud"
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
            "area_auditoria": ["sala", "cocina", "compras", "almacen", "carta", "equipo", "experiencia_cliente", "appcc"],"entidad_comentario": ["tarea", "documento", "accion", "hallazgo", "acta"],"estado_auditoria": ["borrador", "completada"],"estado_cobro": ["pendiente", "cobrada"],"estado_estandar": ["borrador", "en_prueba", "implantado"],"estado_factura": ["pendiente", "validada"],"estado_fase": ["pendiente", "en_curso", "completada"],"estado_informe": ["borrador", "enviado"],"estado_inventario": ["abierto", "cerrado"],"estado_presupuesto": ["borrador", "enviado", "aceptado", "rechazado"],"estado_proyecto": ["diagnostico", "en_curso", "seguimiento", "cerrado"],"estado_tarea": ["pendiente", "en_curso", "bloqueada", "hecha"],"fase_pdca": ["planificar", "hacer", "verificar", "actuar"],"motivo_merma": ["caducidad", "deterioro", "sobreproduccion", "error_elaboracion", "devolucion", "rotura", "otro"],"prioridad": ["baja", "media", "alta"],"rol_global": ["admin", "colaborador", "cliente", "personal"],"rol_proyecto": ["consultor", "colaborador", "cliente", "personal"],"salud_proyecto": ["verde", "ambar", "rojo"],"sentido_kpi": ["subir", "bajar"],"tipo_dafo": ["debilidad", "amenaza", "fortaleza", "oportunidad"],"tipo_documento_compra": ["factura", "albaran"],"tipo_escandallo": ["plato", "elaboracion"],"tipo_estandar": ["sop", "checklist", "ficha", "manual"],"tipo_evento": ["visita", "auditoria", "entrega", "reunion", "formacion", "personal", "otro"],"tipo_hallazgo": ["muda", "dafo", "observacion"],"tipo_hora": ["visita", "oficina", "desplazamiento", "formacion", "reunion", "otro"],"tipo_informe": ["diagnostico", "seguimiento", "cierre"],"tipo_muda": ["sobreproduccion", "esperas", "transporte", "sobreprocesos", "inventario", "movimientos", "defectos_mermas"],"tipo_negocio": ["restaurante", "bar", "cafeteria", "dark_kitchen", "hotel", "grupo", "catering", "otro"],"tipo_plantilla": ["auditoria", "sop", "checklist", "informe"],"unidad_compra": ["kg", "l", "ud"]
          }
        }
} as const
