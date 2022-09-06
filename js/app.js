var AppModule = angular.module("AppModule", []);
AppModule.controller("AppController", function ($scope) {
    $scope.orderQty = 0;
    $scope.shoppingCart = [];
    $scope.getMenu = function () {
        $scope.menuList = CATEGORYDATASET
    }
    $scope.getAllData = function () {
        $scope.itemList = ITEMDATASET;
    }
    $scope.getItemByCategoryId = function (categoryId) {
        if (categoryId == 0 || categoryId == undefined) {
            $scope.itemList = ITEMDATASET;
        } else {
            $scope.itemList = ITEMDATASET.filter(x => x.catId == categoryId);
        }
    }
    $scope.getItemById = function (itemId) {
        $scope.item = ITEMDATASET.find(x => x.id == itemId);
        if ($scope.shoppingCart.length > 0) {
            let findItem = $scope.shoppingCart.find(x => x.id == itemId);
            if (findItem != undefined) {
                $scope.orderQty = findItem.orderQty;
            }
        }
        $scope.showModal('ItemDetialsModal');
    }
    $scope.validateInput = function () {
        $scope.orderQty = $scope.orderQty.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        $scope.orderQty = $scope.orderQty.length <= 0 ? 0 : $scope.orderQty;
    }
    $scope.decreaseQty = function () {
        if ($scope.orderQty > 0) {
            $scope.orderQty -= 1;
        }
    }
    $scope.increaseQty = function (item) {
        if (item.currenctStock > 0 && item.currenctStock > $scope.orderQty) {
            $scope.orderQty += 1;
        } else {
            swal("Out of stock!", "Available Stock: " + item.currenctStock, "error");
        }
    }
    $scope.hideItemDetialsModal = function () {
        $scope.hideModal('ItemDetialsModal');
        $scope.orderQty = 0;
    }
    $scope.removeItem = function (cItem) {
        $scope.itemList.find(x => x.id == cItem.id).currenctStock += cItem.orderQty;
        $scope.shoppingCart.splice($scope.shoppingCart.indexOf(cItem), 1);
        $scope.calculateTotal();
    }
    $scope.addToCart = function (item, qty, confirmation) {
        if (item.currenctStock < qty) {
            swal("Out of stock!", "Available Stock: " + item.currenctStock, "error");
        } else {
            var cartItem = $scope.shoppingCart.find(x => x.id == item.id);
            if (cartItem == undefined) {
                cartItem = item
                cartItem.orderQty = qty;
                cartItem.amount = item.newPrice * qty;
                cartItem.currenctStock = cartItem.currenctStock - qty;
                $scope.shoppingCart.push(cartItem)
            }
            else {
                if (confirmation) {
                    if (cartItem.currenctStock < qty) {
                        swal("Sorry!", "You can't add this item into cart.", "error");
                    } else {
                        $scope.modifyOrderQty(item, qty);
                    }
                } else {
                    swal({
                        title: "You all ready add this item",
                        text: "Do you want to continue?(Y/N)",
                        icon: "warning",
                        buttons: {
                            cancel: "No",
                            yes: { text: "Yes", value: "Yes", }
                        },
                    }).then((value) => {
                        if (value == 'Yes') {
                            if (cartItem.currenctStock < qty || cartItem.currenctStock == 0) {
                                swal("Sorry!", "You can't add this item into cart.", "error");
                            } else {
                                $scope.$apply(function () {
                                    $scope.modifyOrderQty(item, qty);
                                });
                            }
                        }
                    });
                }
            }
        }
        $scope.calculateTotal();
    }
    $scope.modifyOrderQty = function (item, qty) {
        let index = $scope.shoppingCart.findIndex(x => x.id == item.id);
        $scope.shoppingCart[index].orderQty += qty;
        $scope.shoppingCart[index].amount = item.newPrice * $scope.shoppingCart[index].orderQty;
        $scope.shoppingCart[index].currenctStock = $scope.shoppingCart[index].currenctStock - qty;
    }
    $scope.updateCart = function (item, qty) {
        var cartItem = $scope.shoppingCart.find(x => x.id == item.id);
        if (cartItem != undefined) {
            let index = $scope.shoppingCart.findIndex(x => x.id == cartItem.id);
            $scope.shoppingCart[index].currenctStock += $scope.shoppingCart[index].orderQty;
            $scope.shoppingCart[index].orderQty = qty;
            $scope.shoppingCart[index].amount = item.newPrice * $scope.shoppingCart[index].orderQty;
            $scope.shoppingCart[index].currenctStock = $scope.shoppingCart[index].currenctStock - qty;
            $scope.calculateTotal();
        } else {
            $scope.addToCart(item, qty);
        }
    }
    $scope.showCart = function () {
        if ($scope.shoppingCart.length > 0) {
            $scope.showModal('ShoppingCart');
            $scope.calculateTotal();
        }
        else {
            swal("Oops!", "The cart is empty", "error");
        }
    }
    $scope.removeItemForZeroQty = function () {
        let forRemoveItemList = $scope.shoppingCart.filter(x => x.amount <= 0);
        if (forRemoveItemList.length > 0 && forRemoveItemList != undefined) {
            angular.forEach(forRemoveItemList, function (v, i) {
                var index = $scope.shoppingCart.indexOf(v);
                $scope.shoppingCart.splice(index, 1);
            });
        }
    }
    $scope.calculateDiscount = function () {
        $scope.totalDiscount = 0;
        let totalAmount = 0, totalOrderQuantity = 0;
        if ($scope.shoppingCart != undefined && $scope.shoppingCart.length > 0) {
            let discounts = $scope.shoppingCart.map(x => (DISCOUNTDATASET.filter(z => z.catId == x.catId)));
            let uniqueDiscounts = [...new Map(discounts.map(obj => [JSON.stringify(obj), obj])).values()];
            if (uniqueDiscounts.length > 0) {
                let finalDiscountList = uniqueDiscounts.filter(x => x.length > 0);
                angular.forEach(finalDiscountList, function (items, counter) {
                    angular.forEach(items, function (item, counter) {
                        let discountCartItems = $scope.shoppingCart.filter(x => x.catId == item.catId);
                        if (discountCartItems.length > 0 && discountCartItems != undefined) {
                            totalAmount = discountCartItems.reduce((acc, val) => acc += val.amount, 0);
                            totalOrderQuantity = discountCartItems.reduce((acc, val) => acc += val.orderQty, 0);
                            if (item.limitType == "totalqty") {
                                if (totalOrderQuantity >= item.limit) {
                                    if (item.discountType == "percentage") {
                                        $scope.totalDiscount += totalAmount * (item.discountPercent / 100);
                                    } else {
                                        $scope.totalDiscount += item.discountAmount;
                                    }
                                }
                            } else if (item.limitType == "totalamount") {
                                if (totalAmount >= item.limit) {
                                    if (item.discountType == "percentage") {
                                        $scope.totalDiscount += totalAmount * (item.discountPercent / 100);
                                    } else {
                                        $scope.totalDiscount += item.discountAmount;
                                    }
                                }
                            }
                        }
                    });
                });
            }
        }
    }
    $scope.calculateTotal = function () {
        $scope.totalDiscount = 0;
        $scope.calculateDiscount();
        $scope.removeItemForZeroQty();
        let totalAmount = 0;
        totalAmount = $scope.shoppingCart.reduce((acc, val) => acc += val.amount, 0);
        $scope.subTotal = totalAmount;
        $scope.grandTotal = totalAmount - $scope.totalDiscount;
        $scope.applyPromo();
    }
    $scope.applyPromo = function () {
        if ($scope.shoppingCart.length > 0) {
            let promoByCode = PROMODATASET.find(x => x.code == $scope.promoCode)
            if (promoByCode != undefined) {
                if (promoByCode.limit > $scope.subTotal) {
                    $scope.promoCode = ''
                    swal("Oops!", `Spending over � ${promoByCode.limit} for apply this promo.`, "error");
                } else {
                    $scope.totalDiscount += promoByCode.amount;
                    $scope.grandTotal = $scope.subTotal - $scope.totalDiscount;
                }
            } else if ($scope.promoCode != undefined && $scope.promoCode.length > 0) {
                $scope.promoCode = ''
                swal("Oops!", "Invalid Promo Code", "error");
            }
        }
    }
    $scope.checkOut = function () {
        swal("Congratulation!", "Your order is successfully placed.", "success");
        $scope.shoppingCart = [];
        $scope.promoCode = '';
        $scope.grandTotal = 0;
        $scope.subTotal = 0;
        $scope.totalDiscount = 0;
        $scope.hideModal('ShoppingCart');
    }
    $scope.showModal = function (id) { openModal(id); }
    $scope.hideModal = function (id) { closeModal(id); }
    var ITEMDATASET = [
        {
            "id": 1,
            "itemName": "Chiken Fillets, 6 x 100g",
            "catId": 1,
            "catName": "Meat & Poultry",
            "newPrice": 4.5,
            "oldPrice": 4.5,
            "currenctStock": 12,
            "img": "ChickenFillet.jpg"
        },
        {
            "id": 2,
            "itemName": "Sirloin Steaks, 4 x 6-8oz",
            "catId": 1,
            "catName": "Meat & Poultry",
            "newPrice": 45.7,
            "oldPrice": 45.7,
            "currenctStock": 6,
            "img": "SirloinSteaks.jpg"
        },
        {
            "id": 3,
            "itemName": "Whole Free-Range turkey, 1 x 16-18lbs",
            "catId": 1,
            "catName": "Meat & Poultry",
            "newPrice": 43.2,
            "oldPrice": 48.25,
            "currenctStock": 8,
            "img": "WholeFree-Rangeturkey.jpg"
        },
        {
            "id": 4,
            "itemName": "Granny Smith Apples, 4 x 16 each",
            "catId": 2,
            "catName": "Fruit & Vegetables",
            "newPrice": 3.75,
            "oldPrice": 3.75,
            "currenctStock": 0,
            "img": "GrannySmithApples.jpg"
        },
        {
            "id": 5,
            "itemName": "Loose Carrots, 4 x 20 each",
            "catId": 2,
            "catName": "Fruit & Vegetables",
            "newPrice": 2.67,
            "oldPrice": 2.67,
            "currenctStock": 2,
            "img": "LooseCarrots.jpg"
        },
        {
            "id": 6,
            "itemName": "Mandarin Oranges, 6 x 10 x 12",
            "catId": 2,
            "catName": "Fruit & Vegetables",
            "newPrice": 12.23,
            "oldPrice": 12.23,
            "currenctStock": 8,
            "img": "MandarinOranges.jpg"
        },
        {
            "id": 7,
            "itemName": "CauliFlower Florets, 10 x 500g",
            "catId": 2,
            "catName": "Fruit & Vegetables",
            "newPrice": 5,
            "oldPrice": 6.75,
            "currenctStock": 5,
            "img": "CauliFlowerFlorets.jpg"
        },
        {
            "id": 8,
            "itemName": "Coca-Cola, 6 x 2L",
            "catId": 3,
            "catName": "Drinks",
            "newPrice": 8.3,
            "oldPrice": 8.5,
            "currenctStock": 6,
            "img": "Coca-Cola.jpg"
        },
        {
            "id": 9,
            "itemName": "Still Mineral Water, 6 x 24 x 500ml",
            "catId": 3,
            "catName": "Drinks",
            "newPrice": 21.75,
            "oldPrice": 21.75,
            "currenctStock": 9,
            "img": "StillMineralWater.jpg"
        },
        {
            "id": 10,
            "itemName": "Sparkling Mineral Water, 6 x 24 x 500ml",
            "catId": 3,
            "catName": "Drinks",
            "newPrice": 25.83,
            "oldPrice": 25.83,
            "currenctStock": 16,
            "img": "SparklingMineralWater.jpg"
        },
        {
            "id": 11,
            "itemName": "Mars Bar, 6 x 24 x 50g",
            "catId": 4,
            "catName": "Confectionary & Desserts",
            "newPrice": 42.82,
            "oldPrice": 42.82,
            "currenctStock": 4,
            "img": "MarsBar.jpg"
        },
        {
            "id": 12,
            "itemName": "Peppermint Chewing Gum, 6 x 50 x 30g",
            "catId": 4,
            "catName": "Confectionary & Desserts",
            "newPrice": 35.7,
            "oldPrice": 35.7,
            "currenctStock": 6,
            "img": "PeppermintChewingGum.jpg"
        },
        {
            "id": 13,
            "itemName": "Strawberry Cheesecake, 4 x 12 portions",
            "catId": 4,
            "catName": "Confectionary & Desserts",
            "newPrice": 8.52,
            "oldPrice": 8.52,
            "currenctStock": 0,
            "img": "Strawberry-Cheesecake-4.jpg"
        },
        {
            "id": 14,
            "itemName": "Vanilla Ice Cream, 6 x 4L",
            "catId": 4,
            "catName": "Confectionary & Desserts",
            "newPrice": 3.8,
            "oldPrice": 3.8,
            "currenctStock": 2,
            "img": "VanillaIceCream.jpg"
        },
        {
            "id": 15,
            "itemName": "Plain Flour, 10 x 1kg",
            "catId": 5,
            "catName": "Baking/Cooking & Ingredients",
            "newPrice": 6.21,
            "oldPrice": 6.21,
            "currenctStock": 4,
            "img": "PlainFlour.jpg"
        },
        {
            "id": 16,
            "itemName": "Icing Sugar, 12 x 500g",
            "catId": 5,
            "catName": "Baking/Cooking & Ingredients",
            "newPrice": 9.38,
            "oldPrice": 9.38,
            "currenctStock": 6,
            "img": "IcingSugar.jpeg"
        },
        {
            "id": 17,
            "itemName": "Free-Range Eggs, 10 x 12 each",
            "catId": 5,
            "catName": "Baking/Cooking & Ingredients",
            "newPrice": 9.52,
            "oldPrice": 9.52,
            "currenctStock": 9,
            "img": "Free-RangeEggs.jpg"
        },
        {
            "id": 18,
            "itemName": "Caster Suger, 16 x 750g",
            "catId": 5,
            "catName": "Baking/Cooking & Ingredients",
            "newPrice": 12.76,
            "oldPrice": 12.76,
            "currenctStock": 13,
            "img": "CasterSuger.jpg"
        },
        {
            "id": 19,
            "itemName": "Kitchen Roll, 100 x 300 sheets",
            "catId": 6,
            "catName": "Miscellaneous Item",
            "newPrice": 43.92,
            "oldPrice": 43.92,
            "currenctStock": 19,
            "img": "KitchenRoll.jpg"
        },
        {
            "id": 20,
            "itemName": "Paper Plates, 10 x 200 each",
            "catId": 6,
            "catName": "Miscellaneous Item",
            "newPrice": 16.19,
            "oldPrice": 16.19,
            "currenctStock": 7,
            "img": "PaperPlates.jpeg"
        }
    ];
    var CATEGORYDATASET = [
        {
            "id": 1,
            "name": "Meat & Poultry"
        },
        {
            "id": 2,
            "name": "Fruit & Vegetables"
        },
        {
            "id": 3,
            "name": "Drinks"
        },
        {
            "id": 4,
            "name": "Confectionary & Desserts"
        },
        {
            "id": 5,
            "name": "Baking/Cooking & Ingredients"
        },
        {
            "id": 6,
            "name": "Miscellaneous Item"
        }
    ];
    var PROMODATASET = [
        {
            "id": 1,
            "code": "20OFFPROMO",
            "limit": 100,
            "amount": 20
        }
    ];
    var DISCOUNTDATASET = [
        {
            "id": 1,
            "title": "10% off bulk drinks",
            "limit": 10,
            "limitType": "totalqty",
            "discountType": "percentage",
            "discountPercent": 10,
            "discountAmount": 0,
            "catId": 3
        },
        {
            "id": 2,
            "title": "�5 off",
            "limit": 50,
            "limitType": "totalamount",
            "discountType": "amount",
            "discountPercent": 0,
            "discountAmount": 5,
            "catId": 5
        }
    ];
});

function openModal(modalId) {
    $('#' + modalId).modal('show');
}
function closeModal(modalId) {
    $('#' + modalId).modal('hide');
}