mongodb & rabbitmq
<li>
    <ul>agar script run sederhana tambahkan <b>"start":"nodemon src/app.js"<b> dlm scripts ddi package.json<br>
    jd untuk run diterminal cukup <b>npm start<b> yg akan menjlnkan <b>nodemon src/app.js</b></ul>
    <ul>konek ke db mysql gunakan typeorm https://typeorm.io/</ul>
    <ul>testing koneksi dg data <b>"logging": true</b> di ormconfig.json.<br>
    jika sudah terhubung matikan test/print console td dg membuat logging jd false <b>"logging": false</b></ul>
    <ul>bagian update tdk baik karena saat update data yg ingin diupdate tdk keluar tp langsung ditimpa dg data baru</ul>
</li>