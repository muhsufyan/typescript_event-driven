"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var cors = require("cors");
var app = express();
var typeorm_1 = require("typeorm");
// rabbitmq
var amqp = require("amqplib/callback_api");
var product_1 = require("./entity/product");
var axios_1 = require("axios");
(0, typeorm_1.createConnection)().then(function (db) {
    // jlnkan berikut jika konek ke db
    // akses ke database lewat src/entity/product.ts
    var productRepository = db.getMongoRepository(product_1.Product);
    // koneksi ke rabbitmq
    amqp.connect("amqp://localhost", function (error0, connection) {
        if (error0) {
            throw error0;
        }
        // jika tdk ada error maka buat channel
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            // deklarasi queue pd rabbitmq
            channel.assertQueue('nama_queue', { durable: false });
            channel.assertQueue('product_created', { durable: false });
            channel.assertQueue('product_deleted', { durable: false });
            channel.assertQueue('product_updated', { durable: false });
            // gunakan middleware cors
            app.use(cors({
                // index 0: reactjs, 1:vuejs, 2:angularjs
                origin: ["http:localhost:3000", "http:localhost:8080", "http:localhost:4200"]
            }));
            // gunakan middleware json untuk convert data
            app.use(express.json());
            // consumer
            channel.consume("nama_queue", function (message) {
                console.log(message.content.toString());
            });
            // consumer ketika event buat product baru di admin/express (mysql)
            channel.consume('product_created', function (msg) { return __awaiter(void 0, void 0, void 0, function () {
                var eventProduct, product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            eventProduct = JSON.parse(msg.content.toString());
                            product = new product_1.Product();
                            // fetch data
                            product.admin_id = parseInt(eventProduct.id);
                            product.title = eventProduct.title;
                            product.image = eventProduct.image;
                            product.like = eventProduct.like;
                            // simpan data ke mongodb
                            return [4 /*yield*/, productRepository.save(product)];
                        case 1:
                            // simpan data ke mongodb
                            _a.sent();
                            console.log('product created');
                            return [2 /*return*/];
                    }
                });
            }); }, { noAck: true });
            // consumer ketika event update product di admin/express (mysql)
            channel.consume('product_updated', function (msg) { return __awaiter(void 0, void 0, void 0, function () {
                var eventProduct, product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            eventProduct = JSON.parse(msg.content.toString());
                            return [4 /*yield*/, productRepository.findOne({ where: { admin_id: parseInt(eventProduct.id) } })
                                // timpa data lama dg data baru dimongodb
                            ];
                        case 1:
                            product = _a.sent();
                            // timpa data lama dg data baru dimongodb
                            productRepository.merge(product, {
                                // fetch data
                                title: eventProduct.title,
                                image: eventProduct.image,
                                like: eventProduct.like
                            });
                            // simpan data ke db
                            return [4 /*yield*/, productRepository.save(product)];
                        case 2:
                            // simpan data ke db
                            _a.sent();
                            console.log('product updated');
                            return [2 /*return*/];
                    }
                });
            }); }, { noAck: true });
            // consumer ketika event hapus product di admin/express (mysql)
            channel.consume('product_deleted', function (msg) { return __awaiter(void 0, void 0, void 0, function () {
                var admin_id;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            admin_id = parseInt(msg.content.toString());
                            // hapus product yg dipilih di admin/express (mysql)
                            return [4 /*yield*/, productRepository.deleteOne({ admin_id: admin_id })];
                        case 1:
                            // hapus product yg dipilih di admin/express (mysql)
                            _a.sent();
                            console.log('product deleted');
                            return [2 /*return*/];
                    }
                });
            }); });
            // tampilkan semua data product yg tersimpan di mongodb
            app.get('/api/products', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var products;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.find()];
                        case 1:
                            products = _a.sent();
                            return [2 /*return*/, res.send(products)];
                    }
                });
            }); });
            // like product, simpan ke mongodb dan simpan juga ke admin/express(mysql). jd ketika di admin/express(mysql) menambah like maka di mongodb akan tetap(tdk berubah)
            app.post('/api/products/:id/like', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.findOne({ where: { admin_id: parseInt(req.params.id) } })
                            // tambah like ke admin/express(mysql) menggunakan axios (lewat url dari admin/express(mysql))
                        ];
                        case 1:
                            product = _a.sent();
                            // tambah like ke admin/express(mysql) menggunakan axios (lewat url dari admin/express(mysql))
                            return [4 /*yield*/, axios_1.default.post("http://localhost:8000/api/products/".concat(product.admin_id, "/like"), {})
                                // tambah 1 like
                            ];
                        case 2:
                            // tambah like ke admin/express(mysql) menggunakan axios (lewat url dari admin/express(mysql))
                            _a.sent();
                            // tambah 1 like
                            product.like++;
                            // simpan ke mongodb
                            return [4 /*yield*/, productRepository.save(product)];
                        case 3:
                            // simpan ke mongodb
                            _a.sent();
                            return [2 /*return*/, res.send(product)];
                    }
                });
            }); });
            console.log("this app on port 7777");
            app.listen(7777);
            // stop koneksi rabbitmq
            process.on("beforeExit", function () {
                console.log("close");
                connection.close();
            });
        });
    });
});
