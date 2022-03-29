import * as express from 'express'
import * as cors from 'cors'
const app = express()
import {Request, Response} from 'express'
import {createConnection} from "typeorm";
// rabbitmq
import * as amqp from "amqplib/callback_api";  
import { Product } from './entity/product';
import axios from 'axios';
createConnection().then(db=>{
    // jlnkan berikut jika konek ke db
    // akses ke database lewat src/entity/product.ts
    const productRepository = db.getMongoRepository(Product);
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
            // deklarasi queue pd rabbitmq
            channel.assertQueue('nama_queue', {durable:false})
            channel.assertQueue('product_created', {durable:false})
            channel.assertQueue('product_deleted', {durable:false})
            channel.assertQueue('product_updated', {durable:false})
             // gunakan middleware cors
            app.use(cors({
                // index 0: reactjs, 1:vuejs, 2:angularjs
                origin: ["http:localhost:3000","http:localhost:8080", "http:localhost:4200"]
            }))
            // gunakan middleware json untuk convert data
            app.use(express.json())
            // consumer
            channel.consume("nama_queue",(message)=>{
                console.log(message.content.toString())
            })
            // consumer ketika event buat product baru di admin/express (mysql)
            channel.consume('product_created', async (msg) => {
                // tangkap semua data yg baru dibuat dari admin/express (mysql)
                const eventProduct: Product = JSON.parse(msg.content.toString())
                // instansiasi ke collection product (karena ini adlh mongodb)
                const product = new Product()
                // fetch data
                product.admin_id = parseInt(eventProduct.id)
                product.title = eventProduct.title
                product.image = eventProduct.image
                product.like = eventProduct.like
                // simpan data ke mongodb
                await productRepository.save(product)
                console.log('product created')
            }, {noAck: true})
            // consumer ketika event update product di admin/express (mysql)
            channel.consume('product_updated', async (msg) => {
                // tangkap semua data yg diupdate dari admin/express (mysql)
                const eventProduct: Product = JSON.parse(msg.content.toString())
                // cari data dg admin_id sesuai dg data product yg diupdate pd express/admin
                const product = await productRepository.findOne({where:{admin_id: parseInt(eventProduct.id)}})
                // timpa data lama dg data baru dimongodb
                productRepository.merge(product, {
                    // fetch data
                    title: eventProduct.title,
                    image: eventProduct.image,
                    like: eventProduct.like
                })
                // simpan data ke db
                await productRepository.save(product)
                console.log('product updated')
            }, {noAck: true})
            // consumer ketika event hapus product di admin/express (mysql)
            channel.consume('product_deleted', async (msg) => {
                // tangkap id data product yg akan dihapus dari admin/express (mysql)
                const admin_id = parseInt(msg.content.toString())
                // hapus product yg dipilih di admin/express (mysql)
                await productRepository.deleteOne({admin_id})
                console.log('product deleted')
            })
            // tampilkan semua data product yg tersimpan di mongodb
            app.get('/api/products', async (req: Request, res: Response) => {
                const products = await productRepository.find()
                return res.send(products)
            })
            // like product, simpan ke mongodb dan simpan juga ke admin/express(mysql). jd ketika di admin/express(mysql) menambah like maka di mongodb akan tetap(tdk berubah)
            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                // cari id product yg ingin di like
                const product = await productRepository.findOne({where:{admin_id: parseInt(req.params.id)}})
                // tambah like ke admin/express(mysql) menggunakan axios (lewat url dari admin/express(mysql))
                await axios.post(`http://localhost:8000/api/products/${product.admin_id}/like`, {})
                // tambah 1 like
                product.like++
                // simpan ke mongodb
                await productRepository.save(product)
                return res.send(product)
            });
            console.log("this app on port 7777")
            app.listen(7777)
            // stop koneksi rabbitmq
            process.on("beforeExit",()=>{
                console.log("close")
                connection.close()
            })
        })
    
})
})



   
