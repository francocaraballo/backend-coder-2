import passport from "passport";
import local from "passport-local";
import GitHubStrategy from "passport-github2";
import jwt from 'passport-jwt';
import userModel from "../models/user.model.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.js";
import { CALLBACK_URL, CLIENT_ID, CLIENT_SECRET } from './config.js';

const LocalStrategy = local.Strategy; // Defino la estrategia local
const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;

const cookieExtractor = (req) => {
    let token = null;
    if(req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
}

const initializePassport = () => {
    // Pasos necesarios para trabajar via HTTP
    passport.serializeUser((user, done) => {
        // Guarda el ID del usuario en la sesión
        done(null, user._id);
    });
      
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userModel.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
        });
    //Nota que passport utiliza sus propios "middlewares" de acuerdo a cada estrategia
    //Inicializamos la estrategia local
    /*
    * usernameField: 'email' => campo que se usara para el login, en este caso el email
    * done => callback que se ejecuta al finalizar la autenticacion, el primer argumento es el error,
    *         el segundo es el usuario
    */
    passport.use('register', new LocalStrategy(
        {passReqToCallback: true, usernameField: 'email'},
        async (req, username, password, done) => {
            try {
                const { first_name, last_name, email, age } = req.body

                const existingUser = await userModel.findOne({ email })
                if(existingUser) {
                    return done(null, false, { message: "Email already register" });
                }

                const user = await userModel.create({
                    first_name,
                    last_name, 
                    email, 
                    password: hashPassword(password.toString()),
                    age
                });
                return done(null, user);

            }catch (e) {
                console.log(e);
                done(e);
            }
        }));

    passport.use('login', new LocalStrategy(
    { usernameField: 'email' },
    async(username, password, done) => {
        try {
            const user = await userModel.findOne({ email: username });
            const isValidPassword = comparePassword(password, user.password);
            if(user && isValidPassword) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (error) {
            done("Error login: " + error);
        }
    }))

    passport.use('github', new GitHubStrategy({
        clientID: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        callbackURL: CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await userModel.findOne({ email: profile._json.email });
            if(!user) {
                const newUser = {
                    first_name: profile._json.name,
                    last_name: ' ', // No se puede obtener el apellido ni la edad
                    age: 18, // Entonces hay que rellenar estos valores
                    email: profile._json.email,
                    password: '1234'
                }
                const result = await userModel.create(newUser);
                done(null, result);
            } else {
                done(null, user);
            }
        } catch (e) {
            console.log(e);
            return done(e);
        }
    }))

    // Extrae el token y lo valida
    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey: 'secreto',
    },
    async (jwt_payload, done) => {
        try {
            return done(null, jwt_payload.user);
        } catch (error) {
            return done(error);
        }}))
        
}

// Esta funcion autoriza el acceso a las rutas, mediante una estrategia determinada
export const passportCall = ( strategy ) => {
    return async ( req, res, next ) => {
        passport.authenticate( strategy, ( err, user, info ) => { // los parametros tienen ese orden por el next(err, user, info)
            if(err) return next(err);
            if(!user) {
                return res.status(401).send({ error: info.message });
            }
            req.user = user;
            next();
        }) (req, res, next); // Ejecuto la funcion que retorna el middleware
    }
}

export default initializePassport;