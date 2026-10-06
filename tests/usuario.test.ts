import { describe, expect, test } from "bun:test";

import Empresa from "../src/domain/Empresa";
import Usuario, { handleValido, normalizarHandle } from "../src/domain/Usuario";

describe("usuarios", () => {
  test("normaliza el handle (minúsculas, sin símbolos)", () => {
    expect(normalizarHandle("  Faku_99 ")).toBe("faku_99");
    expect(normalizarHandle("A B!C")).toBe("abc");
  });

  test("valida el handle", () => {
    expect(handleValido("faku")).toBe(true);
    expect(handleValido("faku_99")).toBe(true);
    expect(handleValido("ab")).toBe(false);
    expect(handleValido("a".repeat(21))).toBe(false);
  });

  test("agrega y quita empresas sin duplicar", () => {
    const usuario = new Usuario("faku", "Faku", "hash");
    const empresa = new Empresa("Faku Corp", 1, [], 100, [], { duenio: usuario });

    usuario.agregarEmpresa(empresa);
    usuario.agregarEmpresa(empresa);
    expect(usuario.empresas).toHaveLength(1);
    expect(usuario.perfil.empresas).toEqual(["Faku Corp"]);

    usuario.quitarEmpresa(empresa);
    expect(usuario.empresas).toHaveLength(0);
  });

  test("una empresa sin dueño es manejada por el sistema", () => {
    const empresa = new Empresa("E", 1);
    expect(empresa.duenio).toBeNull();
    expect(empresa.esDeUsuario).toBe(false);
  });
});
