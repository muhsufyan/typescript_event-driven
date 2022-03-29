"use strict";
// // kita coba console log lalu jlnkan tsc
// console.log("jalankan aku dengan tsc di terminal, halo")
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
var typeorm_1 = require("typeorm");
var product_1 = require("./entity/product");
// rabbitmq
var amqp = require("amqplib/callback_api");
// konek ke db
(0, typeorm_1.createConnection)().then(function (db) {
    // jlnkan berikut jika konek ke db
    // akses ke database lewat src/entity/product.ts
    var productRepository = db.getRepository(product_1.Product);
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
            // jika tdk ada error apapun
            var app = express();
            // gunakan middleware cors
            app.use(cors({
                // index 0: reactjs, 1:vuejs, 2:angularjs
                origin: ["http:localhost:3000", "http:localhost:8080", "http:localhost:4200"]
            }));
            // gunakan middleware json untuk convert data
            app.use(express.json());
            // get all products
            app.get("/api/products", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var products;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.find()
                            // kirim data ke rabbitmq lewat channel (producer)
                        ];
                        case 1:
                            products = _a.sent();
                            // kirim data ke rabbitmq lewat channel (producer)
                            channel.sendToQueue('nama_queue', Buffer.from("datanya"));
                            res.json(products);
                            return [2 /*return*/];
                    }
                });
            }); });
            // buat product baru dan simpan ke db
            app.post("/api/products", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var create_new_product, store;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.create(req.body)];
                        case 1:
                            create_new_product = _a.sent();
                            return [4 /*yield*/, productRepository.save(create_new_product)
                                // kirim data ke rabbitmq lewat channel (producer)
                            ];
                        case 2:
                            store = _a.sent();
                            // kirim data ke rabbitmq lewat channel (producer)
                            channel.sendToQueue('product_created', Buffer.from(JSON.stringify(store)));
                            return [2 /*return*/, res.send(store)];
                    }
                });
            }); });
            // get one product
            app.get("/api/products/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.findOneOrFail({ where: { id: Number(req.params.id) } })]; //tdk ada handler error saat data tdk ditemukan
                        case 1:
                            product = _a.sent() //tdk ada handler error saat data tdk ditemukan
                            ;
                            return [2 /*return*/, res.send(product)
                                // return res.send(typeof Number(req.params.id))
                            ];
                    }
                });
            }); });
            // update one product
            app.put("/api/products/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product, store;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.findOneOrFail({ where: { id: Number(req.params.id) } })
                            // catch all data will update 
                        ]; //tdk ada handler error saat data tdk ditemukan
                        case 1:
                            product = _a.sent() //tdk ada handler error saat data tdk ditemukan
                            ;
                            // catch all data will update 
                            productRepository.merge(product, req.body);
                            return [4 /*yield*/, productRepository.save(product)
                                // kirim data ke rabbitmq lewat channel (producer)
                            ];
                        case 2:
                            store = _a.sent();
                            // kirim data ke rabbitmq lewat channel (producer)
                            channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(store)));
                            return [2 /*return*/, res.send(store)];
                    }
                });
            }); });
            // delete one product
            app.delete("/api/products/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.delete(req.params.id)
                            // kirim data ke rabbitmq lewat channel (producer)
                        ]; //tdk ada handler error saat data tdk ditemukan
                        case 1:
                            product = _a.sent() //tdk ada handler error saat data tdk ditemukan
                            ;
                            // kirim data ke rabbitmq lewat channel (producer)
                            channel.sendToQueue('product_deleted', Buffer.from(req.params.id));
                            return [2 /*return*/, res.send(product)];
                    }
                });
            }); });
            // like product with particular id
            app.post("/api/products/:id/like", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product, store;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.findOne({ where: { id: Number(req.params.id) } })];
                        case 1:
                            product = _a.sent();
                            product.like++;
                            return [4 /*yield*/, productRepository.save(product)];
                        case 2:
                            store = _a.sent();
                            return [2 /*return*/, res.send(store)];
                    }
                });
            }); });
            console.log("this app on port 8000");
            app.listen(8000);
            process.on("beforeExit", function () {
                console.log("close");
                connection.close();
            });
        });
    });
});
