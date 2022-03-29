// // kita coba console log lalu jlnkan tsc
// console.log("jalankan aku dengan tsc di terminal, halo")

import * as express from 'express'
import * as cors from 'cors'
import {createConnection} from "typeorm";
import {Request, Response} from 'express'
import { Product } from './entity/product';
// rabbitmq
import * as amqp from "amqplib/callback_api";  
// konek ke db
createConnection().then(db=>{
    // jlnkan berikut jika konek ke db
    // akses ke database lewat src/entity/product.ts
    const productRepository = db.getRepository(Product);
    // koneksi ke rabbitmq
    amqp.connect("amqp://localhost", (error0, connection)=>{
        if (error0){
            throw error0;
        }
        // jika tdk ada error maka buat channel
        connection.createChannel((error1, channel)=>{
            if (error1){
                throw error1
            }
            // jika tdk ada error apapun
            const app = express()
            // gunakan middleware cors
            app.use(cors({
                // index 0: reactjs, 1:vuejs, 2:angularjs
                origin: ["http:localhost:3000","http:localhost:8080", "http:localhost:4200"]
            }))
            // gunakan middleware json untuk convert data
            app.use(express.json())
            // get all products
            app.get("/api/products", async (req: Request, res: Response)=>{
                // eksekusi dan get query find all products from db
                const products = await productRepository.find()
                // kirim data ke rabbitmq lewat channel (producer)
                channel.sendToQueue('nama_queue', Buffer.from("datanya"))
                res.json(products)
            })
            // buat product baru dan simpan ke db
            app.post("/api/products", async(req: Request, res: Response)=>{
                // catch all data from client who want make new product
                const create_new_product = await productRepository.create(req.body);
                // save all data catched on db
                const store = await productRepository.save(create_new_product)
                // kirim data ke rabbitmq lewat channel (producer)
                channel.sendToQueue('product_created', Buffer.from(JSON.stringify(store)))
                return res.send(store)
            })
            // get one product
            app.get("/api/products/:id", async (req: Request, res: Response)=>{
                // eksekusi dan get query find product with id (id get from url param with :id) from db
                const product = await productRepository.findOneOrFail({where: {id: Number(req.params.id)}})//tdk ada handler error saat data tdk ditemukan
                return res.send(product)
                // return res.send(typeof Number(req.params.id))
            })
            // update one product
            app.put("/api/products/:id", async (req: Request, res: Response)=>{
                // eksekusi dan get query find product with id (id get from url param with :id) from db
                const product = await productRepository.findOneOrFail({where: {id: Number(req.params.id)}})//tdk ada handler error saat data tdk ditemukan
                // catch all data will update 
                productRepository.merge(product, req.body)
                // save all data catched on db
                const store = await productRepository.save(product)
                // kirim data ke rabbitmq lewat channel (producer)
                channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(store)))
                return res.send(store)
            })
                // delete one product
            app.delete("/api/products/:id", async (req: Request, res: Response)=>{
                // eksekusi dan hapus product with id (id get from url param with :id) from db
                const product = await productRepository.delete(req.params.id)//tdk ada handler error saat data tdk ditemukan
                // kirim data ke rabbitmq lewat channel (producer)
                channel.sendToQueue('product_deleted', Buffer.from(req.params.id))
                return res.send(product)
                })
            
            // like product with particular id
            app.post("/api/products/:id/like", async (req: Request, res: Response)=>{
                // get the data of product with particular id from db
                const product = await productRepository.findOne({where: {id: Number(req.params.id)}})
                product.like++
                const store = await productRepository.save(product)
                return res.send(store)

            })
            console.log("this app on port 8000")
            app.listen(8000)
            process.on("beforeExit",()=>{
                console.log("close")
                connection.close()
            })
        })
    })
})
