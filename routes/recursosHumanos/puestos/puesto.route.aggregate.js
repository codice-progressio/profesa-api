module.exports = function() {
  var a = departamento()
    .concat(departamento_area())
    .concat(motivoDeCambio_usuario())
    .concat(cursosRequeridos())
    .concat(personalACargo())
    .concat(puedeDesarrollarseEnLasSiguientesAreas())
    .concat(reportaA())
    .concat(quienes("quien.desarrollo"))
    .concat(quienes("quien.aprobo"))
    .concat(quienes("quien.reviso"))
    .concat(relacionCliPro_externos())

  return a
}

function relacionCliPro_externos() {
  const c = "relacionClienteProveedor.internos"

  return $unwind(`$${c}`)
    .concat([
      {
        $lookup: {
          from: "departamentos",
          localField: `${c}.departamento`,
          foreignField: "_id",
          as: `${c}.departamento`
        }
      }
    ])
    .concat($unwind(`$${c}.departamento`))
    .concat([
      {
        $group: {
          _id: "$$ROOT._id",
          root: {
            $mergeObjects: "$$ROOT"
          },
          internos: { $push: `$${c}` }
        }
      },
      {
        $addFields: {
          [`root.${c}`]: "$internos"
        }
      },
      {
        $replaceRoot: { newRoot: "$root" }
      }
    ])
}

function quienes(campo) {
  return [
    {
      $lookup: {
        from: "empleados",
        localField: campo,
        foreignField: "_id",
        as: campo
      }
    }
  ]
    .concat($unwind(`$${campo}`))
    .concat([
      {
        $unset: [
          "asistencia",
          "hijos",
          "fechaDeNacimiento",
          "sexo",
          "curp",
          "rfc",
          "numeroDeCuenta",
          "numeroDeSeguridadSocial",
          "puestoActual",
          "email",
          "celular",
          "telCasa",
          "telEmergencia",
          "nombreEmergencia",
          "estadoCivil",
          "nivelDeEstudios",
          "domicilio",
          "eventos",
          "sueldoActual"
        ].map(x => `${campo}.${x}`)
      }
    ])
}

function reportaA() {
  return [
    {
      $lookup: {
        from: "puestos",
        localField: "reportaA",
        foreignField: "_id",
        as: "reportaA"
      }
    }
  ].concat($unwind("$reportaA"))
}

function puedeDesarrollarseEnLasSiguientesAreas() {
  return $unwind("$elPuestoPuedeDesarrollarseEnLasSiguientesAreas")
    .concat([
      {
        $lookup: {
          from: "puestos",
          localField: "elPuestoPuedeDesarrollarseEnLasSiguientesAreas",
          foreignField: "_id",
          as: "elPuestoPuedeDesarrollarseEnLasSiguientesAreas"
        }
      }
    ])
    .concat($unwind("$elPuestoPuedeDesarrollarseEnLasSiguientesAreas"))
    .concat([
      {
        $group: {
          _id: "$$ROOT._id",
          root: { $mergeObjects: "$$ROOT" },
          elPuestoPuedeDesarrollarseEnLasSiguientesAreas: {
            $push: "$elPuestoPuedeDesarrollarseEnLasSiguientesAreas"
          }
        }
      },
      {
        $addFields: {
          "root.elPuestoPuedeDesarrollarseEnLasSiguientesAreas":
            "$elPuestoPuedeDesarrollarseEnLasSiguientesAreas"
        }
      },
      { $replaceRoot: { newRoot: "$root" } }
    ])
}

function personalACargo() {
  return $unwind("$personalACargo")
    .concat([
      {
        $lookup: {
          from: "puestos",
          localField: "personalACargo",
          foreignField: "_id",
          as: "personalACargo"
        }
      }
    ])
    .concat($unwind("$personalACargo"))
    .concat([
      {
        $group: {
          _id: "$$ROOT._id",
          root: { $mergeObjects: "$$ROOT" },
          personalACargo: {
            $push: "$personalACargo"
          }
        }
      },
      { $addFields: { "root.personalACargo": "$personalACargo" } },
      { $replaceRoot: { newRoot: "$root" } }
    ])
}

function cursosRequeridos() {
  return $unwind("$cursosRequeridos")
    .concat([
      {
        $lookup: {
          from: "cursos",
          localField: "cursosRequeridos",
          foreignField: "_id",
          as: "cursosRequeridos"
        }
      }
    ])
    .concat($unwind("$cursosRequeridos"))
    .concat([
      {
        $group: {
          _id: "$$ROOT._id",
          root: { $mergeObjects: "$$ROOT" },
          cursosRequeridos: { $push: "$cursosRequeridos" }
        }
      },

      {
        $addFields: {
          "root.cursosRequeridos": "$cursosRequeridos"
        }
      }
    ])
    .concat($unwind("$root"))
    .concat([
      {
        $replaceRoot: {
          newRoot: "$root"
        }
      },
      { $unset: "cursosRequeridos.asistencias" }
    ])
}

function departamento_area() {
  return [
    {
      $lookup: {
        from: "areasRH",
        localField: "departamento.area",
        foreignField: "_id",
        as: "departamento.area"
      }
    }
  ].concat($unwind("$departamento.area"))
}

function departamento() {
  return [
    {
      $lookup: {
        from: "departamentos",
        localField: "departamento",
        foreignField: "_id",
        as: "departamento"
      }
    }
  ].concat($unwind("$departamento"))
}

function motivoDeCambio_usuario() {
  return (
    []
      .concat($unwind("$motivoDeCambio"))
      .concat([
        {
          $lookup: {
            from: "usuarios",
            localField: "motivoDeCambio.usuario",
            foreignField: "_id",
            as: "motivoDeCambio.usuario"
          }
        }
      ])
      // Quitamos el arreglo del lookup
      .concat($unwind("$motivoDeCambio.usuario"))
      .concat([
        //Reagrupamos
        {
          $group: {
            _id: "$$ROOT._id",

            motivoDeCambio: {
              $push: "$motivoDeCambio"
            },

            root: { $mergeObjects: "$$ROOT" }
          }
        },
        { $addFields: { "root.motivoDeCambio": "$motivoDeCambio" } },
        { $replaceRoot: { newRoot: "$root" } },
        //Eliminamos el password
        {
          $unset: [
            "motivoDeCambio.usuario.password",
            "motivoDeCambio.usuario.permissions"
          ]
        }

        // <!--
        // =====================================
        //  END motivoDeCambio
        // =====================================
        // -->
      ])
  )
}

function $unwind(campo) {
  return [{ $unwind: { path: campo, preserveNullAndEmptyArrays: true } }]
}
