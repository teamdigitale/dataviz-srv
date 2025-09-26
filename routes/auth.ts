import { Router } from 'express';
import * as bcrypt from 'bcrypt';
import * as db from '../lib/db';
import {
  generateTokens,
  setAccessTokenCookie,
  clearAccestokenCookie,
} from '../lib/jwt';
import * as z from 'zod';
import { sendActivationEmail, sendResetPasswordEmail } from '../lib/email';
import { requireUser, validateRequest } from '../lib/middlewares';

const APP_URL = process.env.APP_URL || '/';

const router = Router();

router.get('/user', (req: any, res) => {
  console.log('check user');
  try {
    const user = req?.user || null;
    if (!user) {
      return res.status(401).json(null);
    }
    console.log('user found', user);
    const token = req?.token || null;
    return res.status(201).json({ ...user, token });
  } catch (error) {
    console.log('Auth user ERROR', error);
  }
});

const registerSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email or password'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(7, 'Password must be at least 7 characters long'),
});
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400);
        throw new Error('You must provide an email and a password.');
      }
      const existingUser = await db.findUserByEmail(email);
      if (existingUser) {
        res.status(409);
        return res.json({ error: { message: 'Email already in use.' } });
      }
      const user = await db.createUserByEmailAndPassword({ email, password });
      //@TODO SEND EMAIL TO ACTIVATE USER
      const pin = await db.createCode(user.id);
      console.log('pin', pin);
      await sendActivationEmail(user, pin);

      // const { accessToken } = generateTokens(user);
      // sendAccessToken(res, accessToken);

      return res.json({ auth: true });
    } catch (err) {
      next(err);
    }
  }
);

const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email or password'),
  password: z.string({ required_error: 'Password is required' }),
});

router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  async (req, res, next) => {
    console.log('login');
    try {
      const { email, password } = req.body;
      const existingUser = await db.findUserByEmail(email);
      if (!existingUser) {
        res.status(401);
        throw new Error('Invalid login credentials.');
      }
      const validPassword = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (!validPassword) {
        res.status(401);
        throw new Error('Invalid login credentials.');
      }
      const { accessToken } = generateTokens(existingUser);
      setAccessTokenCookie(res, accessToken);
      // res.json({
      //   accessToken,
      // });
      res.json({ auth: true });
    } catch (error) {
      next(error);
    }
  }
);

const recoverSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email or password'),
});

router.post(
  '/recover',
  validateRequest({ body: recoverSchema }),
  async (req: any, res) => {
    clearAccestokenCookie(res);
    const { email } = req.body;
    console.log('recover', email);
    const user = await db.findUserByEmail(email);
    if (user) {
      console.log('user', user);
      const pin = await db.createCode(user.id);
      console.log('pin', pin);
      await sendResetPasswordEmail(user, pin);
    }
    return res.status(200);
  }
);

router.get('/logout', (req: any, res) => {
  console.log('logout, bye');
  clearAccestokenCookie(res);
  return res.status(204);
});

const verifySchema = z.object({
  uid: z.string({
    required_error: 'uid is required',
  }),
  code: z.string({ required_error: 'code is required' }),
});
router.post(
  '/verify',
  validateRequest({ body: verifySchema }),
  async (req: any, res) => {
    const { uid, code } = req.body;
    console.log('uid:', uid, ', code:', code);
    if (!uid || !code) return res.status(401);
    if (req.user) {
      console.log('req.user?', req.user);
      if (req.user.id !== uid) {
        return res.status(400).json({ error: 'Invalid user activation.' });
      }
    }
    const user = await db.findUserById(uid);
    console.log('user?', user);
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }
    const pin = await db.findCodeByUid(uid);
    console.log('pin?', pin);
    if (!pin) {
      console.log('pin not found');
      return res.status(400).json({ error: 'Code invalid or expired.' });
    }
    if (`${pin}`.trim() !== `${code}`.trim()) {
      console.log('pin are not equals');
      return res.status(400).json({ error: 'Code invalid or expired.' });
    }
    console.log('user verifyed');
    const userValue = await db.setVerifyed(user.id);

    await db.destroyCodes(user.id);

    console.log('login user');
    const { accessToken } = generateTokens(userValue);
    setAccessTokenCookie(res, accessToken);
    return res.json({ auth: true });
  }
);

const confirmSchema = z.object({
  uid: z.string({
    required_error: 'uid is required',
  }),
  code: z.string({ required_error: 'code is required' }),
});
router.get(
  '/confirm/:uid/:code',
  validateRequest({ params: confirmSchema }),
  async (req: any, res) => {
    const { uid, code } = req.params;
    console.log('uid:', uid, ', code:', code);
    if (!uid || !code) return res.status(401);
    if (req.user) {
      console.log('req.user?', req.user);
      if (req.user.userId !== uid) {
        return res.status(400).json({ error: 'Invalid user activation.' });
      }
    }
    const user = await db.findUserById(uid);
    console.log('user?', user);
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }
    const pin = await db.findCodeByUid(uid);
    console.log('pin?', pin);
    if (!pin || pin !== code) {
      return res.status(400).json({ error: 'Code invalid or expired.' });
    }
    const userValue = await db.setVerifyed(user.id);
    await db.destroyCodes(user.id);
    const { accessToken } = generateTokens(userValue);
    setAccessTokenCookie(res, accessToken);
    console.log('validate code end');
    // return res.json({ auth: true });
    return res.redirect(APP_URL);
  }
);

const changePwdSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email or password'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(7, 'Password must be at least 7 characters long'),
});
router.put(
  '/pwd',
  [validateRequest({ body: changePwdSchema }), requireUser],
  async (req: any, res: any) => {
    const user = req.user;
    const { password } = req.body;
    if (!user || !password) {
      return res.status(400).json({ error: 'User and password are required.' });
    }
    await db.changePassword(user.id, password);
    return res.status(204);
  }
);

export default router;
