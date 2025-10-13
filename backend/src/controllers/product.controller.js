const productModel = require("../models/product.model")


async function createProduct(req,res){

    const {image , title , price:{amount , currency} , description} = req.body

    try {
        const product = await productModel.create({
            image , title , price:{amount , currency} , description
        })
        return res.status(201).json({
            message:"Product created successfully",
            product
        })
    } catch (error) {
        return res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })
    }
}


async function getItem(req,res){
    try {
        const product = await productModel.findOne()
        return res.status(200).json({
            message:"Product fetched successfully",
            product
        })
    } catch (error) {
        return res.status(500).json({
            message:"Internal Server Error",
            error:error.message
        })
    }
}

module.exports = {
    createProduct,
    getItem
}