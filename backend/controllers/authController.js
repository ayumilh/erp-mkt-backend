import { auth } from "../utils/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import prisma from "../prisma/client.js";
import bcrypt from "bcrypt";

/**
 * POST /api/auth/register
 * Cadastra um novo usuário no Better Auth e na base local (Prisma).
 */
export async function register(req, res) {
  try {
    const { email, senha, telefone, cnpj } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Por favor, forneça email e senha." });
    }

    // 1) Cria usuário no Better Auth
    const result = await auth.api.signUpEmail({
      body: { email, password: senha, name: email }, // 👈 Usando o email como nome
      asResponse: true,
    });

    for (const [key, value] of Object.entries(result.headers || {})) {
      if (Array.isArray(value)) {
        value.forEach(v => res.append(key, v));
      } else if (value !== undefined) {
        res.set(key, value);
      }
    }

    const body = await result.json();

    if (result.status >= 400 || !body.user) {
      return res.status(result.status).json(body);
    }

    const userId = body.user.id;

    await prisma.appUser.create({
      data: {
        id: userId,
        email: email,
        telefone: telefone,
        cnpj: cnpj,
      },
    });

    return res.status(201).json({
      message: "Usuário registrado com sucesso.",
      user: body.user,
    });

  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    return res.status(500).json({ message: "Erro ao registrar usuário." });
  }
}


/**
 * POST /api/auth/login
 * Autentica via Better Auth, replica cookies e retorna dados locais adicionais.
 */
export async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ message: "Por favor, forneça email e senha." });
    }

    // 1) dispara o signIn no Better Auth
    const result = await auth.api.signInEmail({
      body: { email, password: senha },
      asResponse: true,
    });

    // 2) replica todos os headers (cookies de sessão etc)
    for (const [key, value] of Object.entries(result.headers || {})) {
      if (Array.isArray(value)) {
        value.forEach(v => res.append(key, v));
      } else if (value !== undefined) {
        res.set(key, value);
      }
    }
    const rawSetCookie = result.headers.get("set-cookie");

    for (const [key, value] of Object.entries(result.headers || {})) {
      if (Array.isArray(value)) value.forEach((v) => res.append(key, v));
      else if (value !== undefined) res.setHeader(key, value);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (rawSetCookie) {
      const cookies = Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie];
      const patched = cookies.map(cookie =>
        cookie
          .replace(/;\s*SameSite=Lax/i, '; SameSite=None')
          .replace(/;\s*SameSite=Strict/i, '; SameSite=None')
          .replace(/;\s*Secure/i, '') + '; Secure'
      );
      res.setHeader("Set-Cookie", patched);
    }

    const bodyBuffer = await result.arrayBuffer();
    const responseData = JSON.parse(Buffer.from(bodyBuffer).toString());

    // 4) opcional: busca dados extras na sua tabela local
    const local = await prisma.appUser.findUnique({
      where: { id: responseData.user.id },
      select: { telefone: true, cnpj: true },
    });


    // 5) retorna o payload do Better Auth + info local
    return res.status(200).json({
      ...responseData,
      local,
    });

  } catch (err) {
    console.error("Erro ao fazer login:", err);
    return res.status(500).json({ message: "Erro ao fazer login." });
  }
}
