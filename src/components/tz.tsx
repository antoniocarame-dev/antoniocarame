"use client";
import { useEffect, useState } from "react";
/** Envía el desfase horario del navegador para guardar horas locales correctamente. */
export function TzOffset() {
  const [o, setO] = useState(-60);
  useEffect(() => setO(new Date().getTimezoneOffset()), []);
  return <input type="hidden" name="tz_offset" value={o} />;
}
