const pool = require('../../../bd.js');
const multer = require('multer');
const cloudinary = require('../../../utils/configs/configCloudinary.js');

// Configuração local do multer para esta rota
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const validaToken = async (userid) => {

    const result = await pool.query(`SELECT access_token FROM usermercado WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const accessToken = result.rows[0].access_token;
        return accessToken;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

const validaIdUserMercado = async (userid) => {

    const result = await pool.query(`SELECT user_mercado_id FROM usermercado WHERE userid = ${userid}`);

    if (result.rows.length > 0) {
        const user_mercado_ids = result.rows.map(row => row.user_mercado_id);
        return user_mercado_ids;
    } else {
        throw new Error('Usuário não encontrado ou token não definido');
    }
}

// const mercadoProdutosVendedorId = async (userid) => {
//     try {
//         const access_token = await validaToken(userid);
//         const userMercado = await validaIdUserMercado(userid);

//         const baseUrl = `https://api.mercadolibre.com/users/${userMercado}/items/search?search_type=scan`;
//         let results = [];
//         let scrollId = null;
//         let hasMoreResults = true;

//         while (hasMoreResults) {
//             const url = scrollId ? `${baseUrl}&scroll_id=${scrollId}` : baseUrl;

//             const response = await fetch(url, {
//                 headers: { 'Authorization': `Bearer ${access_token}` }
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 let errorMessage = 'Erro na solicitação de produtos';
//                 if (errorData && errorData.error_description) {
//                     errorMessage = errorData.error_description;
//                 }
//                 throw new Error(errorMessage);
//             }

//             const data = await response.json();
//             results = [...results, ...data.results];
//             scrollId = data.scroll_id; // Atualiza o scroll_id para a próxima página
//             hasMoreResults = !!scrollId; // Continua até que não haja mais scroll_id
//         }

//         return results;
//     } catch (error) {
//         console.error('Erro:', error);
//         throw new Error('Erro ao processar a solicitação de Produtos.');
//     }
// };

//Pegar o Id dos itens do vendedor para puxar no Get
const mercadoProdutosVendedorId = async (userid) => {
    try {
        const access_token = await validaToken(userid);
        const userMercado = await validaIdUserMercado(userid);

        console.log("User Mercado:", userMercado);

        // Define API endpoints
        const url1 = `https://api.mercadolibre.com/users/${userMercado}/items/search?orders=stop_time_asc`;
        const url2 = `https://api.mercadolibre.com/users/${userMercado}/items/search?orders=start_time_desc`;

        // Perform both API calls concurrently
        const [response1, response2] = await Promise.all([
            fetch(url1, { headers: { 'Authorization': `Bearer ${access_token}` } }),
            fetch(url2, { headers: { 'Authorization': `Bearer ${access_token}` } })
        ]);

        // Check responses
        if (!response1.ok || !response2.ok) {
            const errorData = !response1.ok ? await response1.json() : await response2.json();
            let errorMessage = 'Erro na solicitação do token';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }

        const data1 = await response1.json();
        const data2 = await response2.json();
        const results1 = data1.results || [];
        const results2 = data2.results || [];

        // Combine results and remove duplicates
        const combinedResults = new Set([...results1, ...results2]);

        // Convert Set to Array
        return Array.from(combinedResults);

    } catch (error) {
        console.error('Erro:', error);
        throw new Error('Erro ao processar a solicitação de Produtos.');
    }
};

//SYNC PRODUCTS
const mercadoLivreGetProductsSync = async (req, res) => {
    try {
        const userid = req.query.userId;
        const idProduct = await mercadoProdutosVendedorId(userid); // Pass userid to mercadoProdutosVendedorId
        const access_token = await validaToken(userid); // Pass userid to validaToken

        console.log("Access token:", access_token);
        console.log("User ID:", userid);
        console.log("Product ID:", idProduct);

        // Fetch product details concurrently
        const products = await Promise.all(idProduct.map(async (productId) => {
            const response = await fetch(`https://api.mercadolibre.com/items/${productId}`, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = 'Erro na solicitação do token';
                if (errorData && errorData.error_description) {
                    errorMessage = errorData.error_description;
                }
                throw new Error(errorMessage);
            }

            
            const productData = await response.json();

            const descriptionResponse = await fetch(`https://api.mercadolibre.com/items/${productId}/description`, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });

            if (!descriptionResponse.ok) {
                const errorData = await descriptionResponse.json();
                let errorMessage = 'Erro na solicitação da descrição';
                if (errorData && errorData.error_description) {
                    errorMessage = errorData.error_description;
                }
                throw new Error(errorMessage);
            }

            // const descriptionData = await descriptionResponse.json();
            // console.log("Description Data:", descriptionData);

            return productData;
        }));

        console.log("Products:", products);
        
        // Process each product
        for (const tokenData of products) {
            const title = tokenData.title;
            const price = tokenData.price;
            const status = tokenData.status;
            const sku = tokenData.id;
            const pictureUrls = tokenData.pictures[0]?.url || "N/A";
            const quantity = parseInt(tokenData.available_quantity) || 0;
            const listing = tokenData.listing_type_id || "";
            const condition = tokenData.condition || "";
            const description = tokenData.description || "";
            const video_id = tokenData.video_id || "";
            const warrantyString = tokenData.warranty || "";
            const [warrantyType, warrantyTemp] = warrantyString.split(':').map(str => str.trim());
            const brand = tokenData.attributes.find(attr => attr.id === "BRAND")?.value_name || "";

            console.log("Description:", description);

            // verificar se o produto tem GTIN
            const gtinAttribute = tokenData.variations && tokenData.variations.length > 0 && tokenData.variations[0].attributes ? tokenData.variations[0].attributes.find(attribute => attribute.id === "GTIN") : null;
            const gtin = gtinAttribute ? gtinAttribute.value_name : '';
            console.log("GTIN:", gtin);

            let color = "N/A";
            if (tokenData.variations && tokenData.variations.length > 0) {
                color = tokenData.variations[0].attribute_combinations.find(attr => attr.id === "COLOR")?.value_name || "N/A";
            }

            let diameterValue = "N/A";
            const attributes = tokenData.attributes || [];
            for (const attribute of attributes) {
                if (attribute.id === 'DIAMETER') {
                    diameterValue = attribute.value_name;
                    break;
                }
            }

            // Upload image to Cloudinary
            let cloudinaryImageUrl = "N/A";
            if (pictureUrls !== "N/A") {
                cloudinaryImageUrl = await uploadImageToCloudinary(pictureUrls);
            }

            // Prepare product details object
            const productDetails = {
                sku,
                title,
                price,
                status,
                pictureUrls: cloudinaryImageUrl,
                color,
                diameter: diameterValue,
                date_created: tokenData.date_created,
                last_updated: tokenData.last_updated,
                available_quantity: quantity,
                listing,
                condition,
                description,
                video_id,
                warrantyType,
                warrantyTemp,
                brand,
                gtin
            };

            // Check if the product already exists
            const existingProduct = await pool.query(
                'SELECT * FROM productsMercado WHERE product_sku = $1 AND userid = $2',
                [productDetails.sku, userid]
            );

            if (existingProduct.rows.length > 0) {
                // Update existing product
                const updateQuery = `
                    UPDATE productsMercado SET
                        title = $1,
                        price = $2,
                        status = $3,
                        pictureUrls = $4,
                        color = $5,
                        diameter = $6,
                        date_created = $7,
                        last_updated = $8,
                        available_quantity = $9,
                        listing = $10,
                        condition = $11,
                        description = $12,
                        video_id = $13,
                        warrantyType = $14,
                        warrantyTemp = $15,
                        brand = $16,
                        gtin = $17
                    WHERE product_sku = $18 AND userid = $19
                    RETURNING *;  -- Optional: returns updated record
                `;

                const updateValues = [
                    productDetails.title, productDetails.price, productDetails.status,
                    productDetails.pictureUrls, productDetails.color, productDetails.diameter,
                    productDetails.date_created, productDetails.last_updated,
                    productDetails.available_quantity, productDetails.listing, productDetails.condition,
                    productDetails.description, productDetails.video_id, productDetails.warrantyType,
                    productDetails.warrantyTemp, productDetails.brand, productDetails.gtin,
                    productDetails.sku, userid
                ];

                await pool.query(updateQuery, updateValues);
            } else {
                // Insert new product
                const insertQuery = `
                    INSERT INTO productsMercado (
                        product_sku, title, price, status,
                        pictureUrls, color, diameter, userid,
                        date_created, last_updated, available_quantity, listing, condition,
                        description, video_id, warrantyType, warrantyTemp, brand, gtin
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                    RETURNING *;  -- Optional: returns inserted record
                `;

                const insertValues = [
                    productDetails.sku, productDetails.title, productDetails.price,
                    productDetails.status, productDetails.pictureUrls, productDetails.color,
                    productDetails.diameter, userid,
                    productDetails.date_created, productDetails.last_updated,
                    productDetails.available_quantity, productDetails.listing, productDetails.condition,
                    productDetails.description, productDetails.video_id, productDetails.warrantyType,
                    productDetails.warrantyTemp, productDetails.brand, productDetails.gtin
                ];

                await pool.query(insertQuery, insertValues);
            }
        }

        res.status(200).json({ message: 'Produtos sincronizados com sucesso', products: products });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação de Produtos.' });
    }
};

//Get All Produtos no Banco
const mercadoLivreGetProducts = async (req, res) => {
    try {
        const userid = req.query.userId;
        const searchTerm = req.query.searchTerm;
        const searchColumn = req.query.searchColumn || 'title';
        const precoMin = req.query.precoMin;
        const precoMax = req.query.precoMax;

        if (!userid) {
            return res.status(400).json({ message: 'O parâmetro userid é obrigatório.' });
        }

        let query = 'SELECT * FROM productsMercado WHERE userid = $1';
        const queryParams = [userid];

        // pesquisa
        if (searchTerm && searchTerm.trim() !== '') {
            query += ` AND ${searchColumn} ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${searchTerm}%`);
        }

        // filtros
        if (precoMin) {
            query += ` AND price >= $${queryParams.length + 1}`;
            queryParams.push(precoMin);
        }

        if (precoMax) {
            query += ` AND price <= $${queryParams.length + 1}`;
            queryParams.push(precoMax);
        }

        const productsMercado = await pool.query(query, queryParams);

        res.status(200).json({ products: productsMercado.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os produtos do banco de dados.' });
    }
};

//GET PRODUCT POR ID
const mercadoLivreGetIdProduct = async (req, res) => {

    try {
        const userid = req.query.userId;
        const product_sku = req.query.sku;

        if (!userid) {
            return res.status(400).json({ message: 'User ID não fornecido.' });
        }

        if (!product_sku) {
            return res.status(400).json({ message: 'SKU do produto não fornecido.' });
        }

        const productsMercado = await pool.query('SELECT * FROM productsMercado WHERE product_sku = $2 AND userid = $1', [userid, product_sku]);

        res.status(200).json({ products: productsMercado.rows });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao recuperar os produtos do banco de dados.' });
    }

    // try {
    //     const idProduct = req.query.sku;
    //     const access_token = await validaToken();

    //     const response = await fetch(`https://api.mercadolibre.com/items/${idProduct}?include_attributes=all`, {
    //         headers: {
    //             'Authorization': `Bearer ${access_token}`
    //         }
    //     });

    //     if (!response.ok) {
    //         const errorData = await response.json();
    //         let errorMessage = 'Erro na solicitação do token';
    //         if (errorData && errorData.error_description) {
    //             errorMessage = errorData.error_description;
    //         }
    //         throw new Error(errorMessage);
    //     }

    //     const response1 = await fetch(`https://api.mercadolibre.com/items/${idProduct}/description`, {
    //         headers: {
    //             'Authorization': `Bearer ${access_token}`
    //         }
    //     });

    //     if (!response1.ok) {
    //         const errorData = await response1.json();
    //         let errorMessage = 'Erro na solicitação do token';
    //         if (errorData && errorData.error_description) {
    //             errorMessage = errorData.error_description;
    //         }
    //         throw new Error(errorMessage);
    //     }

    //     const tokenDescription = await response1.json();
    //     const description = tokenDescription.plain_text

    //     const tokenData = await response.json();
    //     const title = tokenData.title || '';
    //     const price = tokenData.price || '';
    //     const quantity = tokenData.available_quantity || '';
    //     const listing = tokenData.listing_type_id || '';
    //     const condition = tokenData.condition || '';
    //     // const pictureUrls = tokenData.pictures[0].url;

    //     const unitsPerPackAttribute = tokenData.attributes.find(attribute => attribute.id === "UNITS_PER_PACK");
    //     const unitsPerPackValueName = unitsPerPackAttribute ? unitsPerPackAttribute.value_name : '';

    //     const productTypeAttribute = tokenData.attributes.find(attribute => attribute.id === "PRODUCT_TYPE");
    //     const productType = productTypeAttribute ? productTypeAttribute.value_name : '';

    //     const brandProduct = tokenData.attributes.find(attribute => attribute.id === "BRAND");
    //     const brand = brandProduct ? brandProduct.value_name : '';

    //     const gtinAttribute = tokenData.variations[0].attributes.find(attribute => attribute.id === "GTIN");
    //     const gtin = gtinAttribute ? gtinAttribute.value_name : '';

    //     const warrantyTypeProduct = tokenData.sale_terms.find(attribute => attribute.id === "WARRANTY_TYPE");
    //     const warrantyType = warrantyTypeProduct ? warrantyTypeProduct.value_name : '';

    //     const warrantyTempProduct = tokenData.sale_terms.find(attribute => attribute.id === "WARRANTY_TIME");
    //     const warrantyTemp = warrantyTempProduct ? warrantyTempProduct.value_name : '';


    //     res.status(200).json({ title: title, price: price, quantity: quantity, gtin: gtin, listing: listing, condition: condition, unitsPerPackValueName: unitsPerPackValueName, description: description, productType: productType, brand: brand, warrantyType: warrantyType, warrantyTemp: warrantyTemp });
    // } catch (error) {
    //     console.error('Erro:', error);
    //     res.status(500).json({ message: 'Erro ao processar a solicitação de Produtos.' });
    // }
};

const uploadImageToCloudinary = async (imageUrl) => {
    try {
        // Baixar a imagem
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');

        // Salvar a imagem temporariamente
        const tempFilePath = path.join(__dirname, 'temp_image');
        fs.writeFileSync(tempFilePath, buffer);

        // Verificar se a imagem é válida
        if (!isValidImage(tempFilePath)) {
            fs.unlinkSync(tempFilePath); // Remover o arquivo temporário
            throw new Error('Invalid image file');
        }

        // Fazer upload da imagem para o Cloudinary
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream((error, result) => {
                fs.unlinkSync(tempFilePath); // Remover o arquivo temporário
                if (error) return reject(error);
                resolve(result.secure_url);
            });
            uploadStream.end(buffer);
        });
    } catch (error) {
        throw new Error('Erro ao fazer upload da imagem: ' + error.message);
    }
};

//POST CREATE PRODUCTS
const mercadoLivreCreateProducts = async (req, res) => {
    try {

        // Log para verificar o conteúdo da requisição
        console.log("Request Body:", req.body);
        console.log("Request File:", req.file);

        const {
            title,
            price,
            quantity,
            listing,
            condition,
            description,
            video_id,
            warrantyType,
            warrantyTemp,
            brand,
            gtin,
            userId
        } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const access_token = await validaToken(userId);

        // Faz o upload da imagem no Cloudinary se o arquivo estiver presente
        let imageUrl = null;
        if (req.file && req.file.buffer) {
            imageUrl = await uploadImageToCloudinary(req.file.buffer);
        }

        console.log("Image URL:", imageUrl);

        // Parâmetros para o JSON de criação do produto
        const createBody = {
            title,
            price,
            quantity,
            listing,
            condition,
            description,
            video_id,
            warrantyType,
            warrantyTemp,
            pictures: imageUrl, // URL da imagem do Cloudinary
            brand,
            gtin,
        };

        console.log(createBody)

        // Obtendo a categoria com base no título
        const responseCat = await fetch(`https://api.mercadolibre.com/sites/MLB/domain_discovery/search?q=${createBody.title}`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!responseCat.ok) {
            const errorData = await responseCat.json();
            let errorMessage = 'Erro na solicitação do token';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }

        const tokenCategoria = await responseCat.json();
        const categoria = tokenCategoria[0].category_id;

        // JSON para criar o produto no Mercado Livre
        const criarProdutoJson = {
            "title": createBody.title,
            "category_id": categoria,
            "price": createBody.price,
            "currency_id": "BRL",
            "available_quantity": createBody.quantity,
            "buying_mode": "buy_it_now",
            "listing_type_id": createBody.listing,
            "condition": createBody.condition,
            "description": {
                "plain_text": createBody.description
            },
            "video_id": createBody.video_id,
            "sale_terms": [
                {
                    "id": "WARRANTY_TYPE",
                    "value_name": createBody.warrantyType
                },
                {
                    "id": "WARRANTY_TIME",
                    "value_name": createBody.warrantyTemp
                }
            ],
            "pictures": [
                {
                    "source": createBody.imageUrl // URL da imagem no Cloudinary
                }
            ],
            "attributes": [
                {
                    "id": "BRAND",
                    "value_name": createBody.brand
                },
                {
                    "id": "GTIN",
                    "name": "Código universal de producto",
                    "value_id": null,
                    "value_name": createBody.gtin
                },
                {
                    "id": "EAN",
                    "value_name": "7898095297749"
                }
            ]
        };

        // Enviando a requisição para criar o produto
        const response = await fetch('https://api.mercadolibre.com/items', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(criarProdutoJson)
        });

        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = 'Erro ao criar produto no Mercado Livre';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }

        const tokenData = await response.json();
        res.status(200).json(tokenData);

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação de Produtos.' });
    }
};


//PUT UPDATE PRODUCTS
const mercadoLivreUpdateProducts = async (req, res) => {
    try {
        const idProduct = req.body.productSKU;
        const description = req.body.description;
        const updateBody = {
            title: req.body.title,
            price: req.body.price,
            quantity: req.body.quantity,
            // listing: req.body.listing,
            condition: req.body.condition,
            // description: req.body.description,
            // video_id: req.body.video_id,
            warrantyType: req.body.warrantyType,
            warrantyTemp: req.body.warrantyTemp,
            // pictures: req.body.imageUrl,
            brand: req.body.brand,
            gtin: req.body.gtin,

        };

        // console.log(idProduct, description, updateBody);
        const access_token = await validaToken();

        const jsonUpdate = {
            "title": `${updateBody.title}`,
            "price": `${updateBody.price}`,
            "available_quantity": `${updateBody.quantity}`,
            "condition": `${updateBody.condition}`,
            "sale_terms": [{
                "id": "WARRANTY_TYPE",
                "value_name": `${updateBody.warrantyType}`
            },
            {
                "id": "WARRANTY_TIME",
                "value_name": `${updateBody.warrantyTemp}`
            }
            ],
            "attributes": [{
                "id": "BRAND",
                "value_name": `${updateBody.brand}`
            },
            {
                "id": "GTIN",
                "name": "Código universal de producto",
                "value_id": null,
                "value_name": `${updateBody.gtin}`
            }
            ]
        };



        const response = await fetch(`https://api.mercadolibre.com/items/${idProduct}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(jsonUpdate)
        });


        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = 'Erro na solicitação do token';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }

        const tokenData = await response.json();

        //////////////////////////////////////////
        //// ALTERANDO A DESCRIÇÂO DO PRODUTO ////
        //////////////////////////////////////////
        const responseDescription = await fetch(`https://api.mercadolibre.com/items/${idProduct}/description?api_version=2`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                "plain_text": `${description}`
            })
        });

        if (!responseDescription.ok) {
            const errorData = await responseDescription.json();
            let errorMessage = 'Erro na solicitação do token';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }

        const tokenDescription = await responseDescription.json();


        const responseTotal = { tokenData, tokenDescription }

        res.status(200).json(responseTotal);
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação de Produtos.' });
    }
};


//Sincronizar estoque
const mercadoSyncStock = async (req, res) => {
    try {
        const idProduct = req.query.sku;
        const access_token = await validaToken();

        const response = await fetch(`https://api.mercadolibre.com/items/${idProduct}?include_attributes=all`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = 'Erro na solicitação do token';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }

        const response1 = await fetch(`https://api.mercadolibre.com/items/${idProduct}/description`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!response1.ok) {
            const errorData = await response1.json();
            let errorMessage = 'Erro na solicitação do token';
            if (errorData && errorData.error_description) {
                errorMessage = errorData.error_description;
            }
            throw new Error(errorMessage);
        }

        const tokenDescription = await response1.json();
        const description = tokenDescription.plain_text

        const tokenData = await response.json();
        const title = tokenData.title;
        const price = tokenData.price;
        const quantity = tokenData.available_quantity;
        const listing = tokenData.listing_type_id;
        const condition = tokenData.condition;
        // const pictureUrls = tokenData.pictures[0].url;

        const unitsPerPackAttribute = tokenData.attributes.find(attribute => attribute.id === "UNITS_PER_PACK");
        const unitsPerPackValueName = unitsPerPackAttribute ? unitsPerPackAttribute.value_name : null;

        const productTypeAttribute = tokenData.attributes.find(attribute => attribute.id === "PRODUCT_TYPE");
        const productType = productTypeAttribute ? productTypeAttribute.value_name : null;

        const brandProduct = tokenData.attributes.find(attribute => attribute.id === "BRAND");
        const brand = brandProduct ? brandProduct.value_name : null;

        const gtinAttribute = tokenData.variations[0].attributes.find(attribute => attribute.id === "GTIN");
        const gtin = gtinAttribute ? gtinAttribute.value_name : '';

        const warrantyTypeProduct = tokenData.sale_terms.find(attribute => attribute.id === "WARRANTY_TYPE");
        const warrantyType = warrantyTypeProduct ? warrantyTypeProduct.value_name : null;

        const warrantyTempProduct = tokenData.sale_terms.find(attribute => attribute.id === "WARRANTY_TIME");
        const warrantyTemp = warrantyTempProduct ? warrantyTempProduct.value_name : null;


        res.status(200).json({ title: title, price: price, quantity: quantity, gtin: gtin, listing: listing, condition: condition, unitsPerPackValueName: unitsPerPackValueName, description: description, productType: productType, brand: brand, warrantyType: warrantyType, warrantyTemp: warrantyTemp });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação de Produtos.' });
    }
};


module.exports = {
    mercadoLivreGetProductsSync,
    mercadoLivreGetProducts,
    mercadoLivreGetIdProduct,
    mercadoLivreCreateProducts,
    mercadoLivreUpdateProducts,
    upload // Exportando o upload para uso no roteador
};
