# Datos de validación UAT

Los escenarios cruzados de equipos no forman parte del despliegue productivo.
La migración histórica `20260813012540_seed_cross_team_uat_scenarios.sql` quedó
protegida por la variable de sesión `app.enable_uat_seed` y, por defecto, no
inserta ningún registro.

Para reconstruir una base exclusiva de UAT, activa la variable en la misma
sesión que ejecuta las migraciones:

```sql
set app.enable_uat_seed = 'on';
```

No habilites esta variable en producción. Los datos UAT ya existentes en un
proyecto remoto deben retirarse mediante un script de limpieza revisado y una
copia de respaldo; este repositorio no los elimina automáticamente.
