import React, { useState } from 'react'
import axios from 'axios'
import { useEffect } from 'react'
import './index.css'
import PaymentButton from './Paymentbutton'

const App = () => {
  const [product, setProduct] = useState(null)

  useEffect(() => {
    axios.get("http://localhost:3000/api/products/getitem")
      .then((res) => {
        setProduct(res.data.product)
        console.log(res.data.product)
      })
  }, [])

  const ProductCard = ({ product }) => {
    return (
      <div className="product-card">
        <img src={product.image} alt={product.title} className="product-image" />
        <h2 className="product-title">{product.title}</h2>
        <p className="product-description">{product.description}</p>
        <p className="product-price">
          {product.price.currency === 'INR' ? '₹' : '$'}{product.price.amount / 100}
        </p>
           <PaymentButton></PaymentButton>
      </div>
    )
  }

  return (
    <div className="app-container">
      {product ? <ProductCard product={product} /> : <p>Loading...</p>}
    </div>
  )
}

export default App
