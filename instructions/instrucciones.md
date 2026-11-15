# Idea base aplicacion Trazzo

Generar una aplicacion con react native, tailwind, exportable a Android escrito con typescript, base de datos con SQLite

El enfoque de la aplicacion es ayudar a los pequeños negocios/emprendimientos a registrar sus ventas e insumos para dar un mejor seguimiento a sus ganancias, tener sección de lista de tareas para poner recordatorios sobre su emprendimiento, ver graficas de las ventas, pero no servirá como punto de venta

Tendra inicio de sesion con Google, Backups en drive de la base de datos, notificacion en app y notificaciones push en el telefono cuando se tiene stock bajo de algún producto o cuando algún insumo esta por caducar

# Restricciones (No implementar por el momento dejar solo inhabilitado)

Registro de empleados
Generación de informes de Excel con las ventas
Lista de tareas
Backup con drive
Notificaciones
Sección de ajustes

la aplicacion será enfocada específicamente en mexico por lo que el idioma y la divisa serán las de mexico

# Cosas a considerar

No permitir registros en 0
No permitir caracteres y/o numeros en registro de nombres
No permitir cantidades negativas

(entre otras que puedan arruinar la experiencia del usuario o la funcionalidad de la aplicacion)

## Colores de la aplicacion

60% Neutros claros (#FAFAFA y #F4F4F5): Mantienen la pantalla limpia, luminosa y con bordes sutiles (#E4E4E7) para separar cada transacción.

30% Primario Carbón (#27272A): En la tarjeta principal del balance diario y en la tipografía principal (#18181B), asegurando máxima legibilidad bajo luz de día o en mostrador.

10% Acento Violeta Eléctrico (#6366F1): Dirige la vista directamente al botón de acción principal (+ Registrar Venta) y al ícono de la pestaña activa.

- Venta Cobrada / Ingreso (Success): #10B981 (con icono ✓)
- Gasto / Devolución / Error (Error): #EF4444 (con icono ✕)
- Pago Pendiente / Fiado (Warning): #F59E0B (con icono !)
- Información / Corte de Caja (Info): #3B82F6 (con icono i

## Interfaces

Aqui van las interfaces por orden y sus extensiones

### 1\. Primer arranque

Mostrar el nombre de la app
Mostrar logo
Boton para iniciar sesion (mandar a interfaz 2)
Boton para registrarse (mandar a interfaz 3)

### 2\. Inicio de sesion

mandara la pantalla de iniciar sesion con Google y si ya tiene una base de datos registrada en una ruta especifica de su drive bajara la informacion y la aplicara a la base de datos local de SQLite

tras eso se lanzara la interfaz de inicio (interfaz 9)

### 3\. Registrarse

mandara a la pantalla de registrarse con Google y lanzara la interfaz 4

### 4\. Pantalla de bienvenida a la aplicacion

Informacion de lo que se puede hacer en la aplicacion
Funciones de la aplicacion
Boton para empezar tour (mandara a la interfaz 5)

### 5\. Tour 1

Solicitar el nombre del usuario indicando que es el nombre que aparecerá en la aplicacion
Boton de confirmar (mandara a la interfaz 6)

### 6\. Tour 2

Solicitar el nombre del negocio/tienda/puesto/etc.
Boton de confirmar (mandara a la interfaz 7)

### 7\. Tour 3

Texto "Que vendes?"
mostrar recuadros de selección con logo alusivo y texto de las siguientes opciones:

* alimentos
* abarrotes
* ropa
* venta por catalogo
* otro

Boton de confirmar (mandara a la interfaz 8)

### 8\. Pantalla de confirmación

circulo con la inicial del usuario (como si fuera la imagen del perfil)

los siguientes campos tendrán un boton de editar a su derecha que mandara a la interfaz en la que se le solicito la informacion del campo correspondiente pero al darle al boton de guardado de esa interfaz regresarlo a la pantalla de confirmación

nombre de usuario
negocio
giro

boton de empezar (mandara a la interfaz 9)

### 9\. Inicio

mensaje hola, \[nombre de usuario] del lado izquierdo | boton de ajustes que será un circulo con el icono del usuario

selector de mes que solo permitirá ver el mes actual y el anterior si este existe (no mas de un mes hacia atras)

mostrador de ingresos junto con la cantidad de ventas realizadas este mes
mostrador de egresos mostrando la cantidad de gastos del mes

mostrador de alertas que solo aparecerá en caso de existir alguna lanzando un pop up (interfaz 10)

mostrador de ganancia (ingresos - egresos) e informacion de venta promedio

mostrador de grafica de venta vs gasto de la semana en curso mostrando de domingo a sabado en verde las barras de los ingresos y en rojo la de los egresos

mostrador de productos mas vendidos con el top de los 4 productos mas vendidos su ganancia de este mes junto con su cantidad vendida

En la parte inferior el menú layout que se mantendrá entre las interfaces teniendo como opciones: inicio, movimientos/ventas, catalogo, lista de tareas, informes

### 10\. Pop up

Recuadro amarillo mostrando un logo de alerta y los insumos/productos bajos en stock (producto x con # stock)
tambien agregar alerta por próxima caducidad de productos de ser ese el caso

### 11\. Movimimentos/Ventas

Nombre de la interfaz y a la derecha boton configuración con logo de usuario (este se mantendrá en todas la interfaces)

selector de mes como en interfaz inicio
boton ventas y boton gastos (mostrar debajo interfaz 13 si esta presionado)
mostrador total vendido en dinero y numero de ventas de este mes
boton agregar nueva venta
lista de ventas del mes mostrando el dia el mes resumen de la venta (productos, metodo de pago) ingreso generado y boton de editar (este mandara a una variación de la interfaz 12)

### 12\. Registro de venta

texto "registra lo que vendiste"
Fecha (selector de fecha que permita registrar fechas pasadas pero no muy lejanas al dia actual)
texto "producto"
buscador de productos (este permitirá buscar el producto a buscar si este no esta entre los mas vendidos de abajo para facil acceso y limpieza)
lista de top productos vendidos para su facil selección

metodo de pago con opciones como efectivo, transferencia, tarjeta, otro

mostrador de total de la venta en precio y numero de artículos
boton de guardar venta

### 13\. Gastos

mostrador de total gastado en el mes en dinero y el numero de registros de este mes
boton nuevo gasto
lista de gastos del mes mostrando el dia el mes resumen de la venta (descripcion, categoria) gasto generado y boton de editar (este mandara a una variación de la interfaz 14)

### 14\. Registro gasto

texto "monto"
campo para registrar monto
texto "descripción"
campo para registrar una descripción del gasto realizado
texto "categoría"
categorías como renta, servicios, insumos, salario, otros
texto "fecha"
selector de fecha parecido a registro venta
texto "nota"
campo opcional de nota sobre el gasto

boton guardar gasto

### 15. Catalogo

texto "productos e insumos"
recuadro con boton productos y boton insumos
mostrador valor de inventario mostrando en precio y mostrador a la derecha mostrando mensaje stock bajo en x artículos

buscador de producto
boton agregar producto (mandara a la interfaz 17)

listado de productos mostrando nombre categoría precio y su tipo (unidad, pz, etc.)

### 16. Insumos (mostrándose cuando en catalogo se presione el boton insumos)

a diferencia del anterior debe mostrar el boton agregar insumo donde solia estar agregar producto (mandara a la interfaz 18)

tambien su listado de insumos con el nombre el precio por unidad y un boton de comprar para facilitar agregar nuevas unidades de estos

### 17. Nuevo producto

texto "nombre"
campo para agregar nombre producto
texto "categoría"
campo para capturar categoría (no debe permitir caracteres ni numeros)
campos precio de venta, costo de producto, stock actual, stock minimo (que será utilizado para alertar cuando el stock es bajo), unidad (selector de tipo de unidad)
switch tipo píldora con texto "caduca?"
al indicar que si se mostrara un selector de fecha para indicar en que fecha caduca que no debe poder seleccionarse anterior a la fecha actual
(nota: el stock se disminuirá automáticamente al registra una venta con el producto)

boton guardar producto

### 18. Nuevo insumo

campos nombre, unidad (como en registro de producto), costo por unidad, stock actual, stock minimo
píldora "caduca?" (como en productos)

## Consideraciones finales

trabajar con las mejores practicas sin redundancias, mejorando la experiencia del usuario y la intuitividad de la aplicacion, validación de campos que muestre apoyo al usuario cuando estos son incorrectos para evitar problemas con la base de datos o valores erróneos, hacer uso de App.pdf como apoyo de este documento sobre las interfaces, hacer uso de git e ir registrando commits constantes informando en cada commit que se altero, dar feedback del proceso y sugerir mejoras. En caso de notar que se puede hacer algún cambio en el stack para mejorar la funcionalidad o practicidad del proyecto en cuanto a la escritura de codigo dar aviso antes de cualquier cambio en el stack.