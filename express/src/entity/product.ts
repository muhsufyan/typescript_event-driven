// file ini berisi pembuatan tabel baru dg nama product di database

import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
// buat tabel baru yaitu product
@Entity()
export class Product {
    // id adlh primary key yg di generate
    @PrimaryGeneratedColumn()
    id: number;
    // buat field baru dg nama title, valuenya berupa string
    @Column()
    title: string;

    @Column()
    image: string;

    @Column({default: 0})
    like: number;
}