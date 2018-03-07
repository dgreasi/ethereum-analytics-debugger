pragma solidity ^0.4.19;

contract DoubleAuction {

    address public market;
    mapping(int => int) consumptionBids;
    int[] _consumptionPrices;
    mapping(int => int) generationBids;
    int[] _generationPrices;
    Clearing public clearing;
    uint public blockCleared;

    modifier onlyBy(address _account)
    {
        require(msg.sender == _account);
        _;
    }

    struct Bid {
        int quantity;
        int price;
    }

    struct Clearing {
        int clearingQuantity;
        int clearingPrice;
        int clearingType; // marginal_seller = 1, marginal_buyer = 2, marginal_price = 3, exact = 4, failure = 5, null = 6
    }
    

    function DoubleAuction() public{
        market = msg.sender;
        blockCleared = block.number;
        clearing.clearingPrice = 0;
        clearing.clearingQuantity = 0;
        clearing.clearingType = 0;

    }


    function consumptionBid(int _quantity, int _price) public{
        if(consumptionBids[_price]==0){
          _consumptionPrices.push(_price);
          consumptionBids[_price] = _quantity;
        } else {
          consumptionBids[_price] = consumptionBids[_price] + _quantity;
        }
    }

    function generationBid(int _quantity, int _price) public{
        if(generationBids[_price]==0){
          _generationPrices.push(_price);
          generationBids[_price] = _quantity;
        } else {
          generationBids[_price] = generationBids[_price] + _quantity;    
        }
    }

    function getPriceCap() pure private returns(int){
        return 9999;
    }

    function getAvg(int a, int b) pure private returns(int){
        return (a + b)/2;
    }

    function quickSortDescending(int[] storage arr, int left, int right) internal {
        int i = left;
        int j = right;
        uint pivotIndex = uint(left + (right - left) / 2);
        int pivot = arr[pivotIndex];
        while (i <= j) {
            while (arr[uint(i)] > pivot) i++;
            while (arr[uint(j)] < pivot) j--;
            if (i <= j) {
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                i++;
                j--;
            }
        }
        if (left < j)
            quickSortDescending(arr, left, j);
        if (i < right)
            quickSortDescending(arr, i, right);
    }

    function quickSortAscending(int[] storage arr, int left, int right) internal {
        int i = left;
        int j = right;
        uint pivotIndex = uint(left + (right - left) / 2);
        int pivot = arr[pivotIndex];
        while (i <= j) {
            while (arr[uint(i)] < pivot) i++;
            while (arr[uint(j)] > pivot) j--;
            if (i <= j) {
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                i++;
                j--;
            }
        }
        if (left < j)
            quickSortAscending(arr, left, j);
        if (i < right)
            quickSortAscending(arr, i, right);
    }

    function marketClearing() public{
        if ((block.number-blockCleared) > 64) {
		    blockCleared = block.number;
    		if(_consumptionPrices.length > 340 || _generationPrices.length > 100){
    			deleteMapArrays();
    		}
    		else{
    			computeClearing();
    		}
	    }
    }

    function computeClearing() private{
            bool check = false;
            int a = getPriceCap();
            int b = -getPriceCap();
            int demand_quantity = 0;
            int supply_quantity = 0;
            int buy_quantity = 0;
            int sell_quantity = 0;
            uint i = 0;  
            uint j = 0;

            //sort arrays, consumer's bid descending, producer's ascending
            if (_consumptionPrices.length != 0){
                    quickSortDescending(_consumptionPrices, 0, int(_consumptionPrices.length - 1));
            }
            if (_generationPrices.length != 0){
                    quickSortAscending(_generationPrices, 0, int(_generationPrices.length - 1));
            }
            if(_consumptionPrices.length > 0 && _generationPrices.length > 0){
                
                Bid memory buy = Bid({
                    quantity: consumptionBids[_consumptionPrices[i]],
                    price: _consumptionPrices[i]
                });
                Bid memory sell = Bid({
                    quantity: generationBids[_generationPrices[j]],
                    price: _generationPrices[j]
                });
                clearing.clearingType = 6;  
                while(i<_consumptionPrices.length && j<_generationPrices.length && buy.price>=sell.price){
                    buy_quantity = demand_quantity + buy.quantity;
                    sell_quantity = supply_quantity + sell.quantity;
                    if (buy_quantity > sell_quantity){
                        supply_quantity = sell_quantity;
                        clearing.clearingQuantity = sell_quantity;
                        b = buy.price;
                        a = buy.price;
                        ++j;
                        
                        if(j < _generationPrices.length){
                           sell.price =  _generationPrices[j];
                           sell.quantity = generationBids[_generationPrices[j]];
                        }
                        check = false;
                        clearing.clearingType = 2;
                    }
                    else if (buy_quantity < sell_quantity){
                        demand_quantity = buy_quantity;
                        clearing.clearingQuantity = buy_quantity;
                        b = sell.price;
                        a = sell.price;
                        i++;
                        
                        if(i < _consumptionPrices.length){
                            buy.price =  _consumptionPrices[i];
                            buy.quantity = consumptionBids[_consumptionPrices[i]];
                        }
                        check = false;
                        clearing.clearingType = 1;
                    }
                    else{
                        supply_quantity = buy_quantity;
                        demand_quantity = buy_quantity;
                        clearing.clearingQuantity = buy_quantity;
                        a = buy.price;
                        b = sell.price;
                        i++;
                        j++;
                        
                        if(i < _consumptionPrices.length){
                            buy.price =  _consumptionPrices[i];
                            buy.quantity = consumptionBids[_consumptionPrices[i]];
                        }
                        
                        if(j < _generationPrices.length){
                           sell.price =  _generationPrices[j];
                           sell.quantity = generationBids[_generationPrices[j]];
                        }
                        
                        check = true;
                    }
                    
                }
                if(a == b){
                    clearing.clearingPrice = a;
                }
                if(check){ /* there was price agreement or quantity disagreement */
                    clearing.clearingPrice = a;
                    if(supply_quantity == demand_quantity){
                        if(i == _consumptionPrices.length || j ==  _generationPrices.length){
                            if(i == _consumptionPrices.length && j == _generationPrices.length){ // both sides exhausted at same quantity
                                if(a == b){
                                    clearing.clearingType = 4;
                                } else {
                                    clearing.clearingType = 3;
                                }
                            } else if (i == _consumptionPrices.length && b == sell.price){ // exhausted buyers, sellers unsatisfied at same price
                                clearing.clearingType = 1;
                            } else if (j == _generationPrices.length && a == buy.price){ // exhausted sellers, buyers unsatisfied at same price
                                clearing.clearingType = 2;
                            } else { // both sides satisfied at price, but one side exhausted
                                if(a == b){
                                    clearing.clearingType = 4;
                                } else {
                                    clearing.clearingType = 3;
                                }
                            }
                        }else {
                            if(a != buy.price && b != sell.price && a == b){
                                clearing.clearingType = 4; // price changed in both directions
                            } else if (a == buy.price && b != sell.price){
                                // sell price increased ~ marginal buyer since all sellers satisfied
                                clearing.clearingType = 2;
                            } else if (a != buy.price && b == sell.price){
                                // buy price increased ~ marginal seller since all buyers satisfied
                                clearing.clearingType = 1;
                                clearing.clearingPrice = b; // use seller's price, not buyer's price
                            } else if(a == buy.price && b == sell.price){
                                // possible when a == b, q_buy == q_sell, and either the buyers or sellers are exhausted
                                if(i == _consumptionPrices.length && j == _generationPrices.length){
                                    clearing.clearingType = 4;
                                } else if (i ==  _consumptionPrices.length){ // exhausted buyers
                                    clearing.clearingType = 1;
                                } else if (j == _generationPrices.length){ // exhausted sellers
                                    clearing.clearingType = 2;
                                }
                            } else {
                                clearing.clearingType = 3; // marginal price
                            }
                        }
                    }
                    if(clearing.clearingType == 3){
                        // needs to be just off such that it does not trigger any other bids
                       //clearing.clearingPrice = getClearingPriceType3(i, j, a, b, buy, sell);
                        if(a == getPriceCap() && b != -getPriceCap()){
                            if(buy.price > b){
                                clearing.clearingPrice =  buy.price + 1;
                            }else{
                                 clearing.clearingPrice =  b;
                            }
                        } else if(a != getPriceCap() && b == -getPriceCap()){
                            if(sell.price < a){
                                clearing.clearingPrice =  sell.price - 1;
                            }else{
                                 clearing.clearingPrice =  a;
                            }
                        } else if(a == getPriceCap() && b == -getPriceCap()){
                            if(i == _consumptionPrices.length && j == _generationPrices.length){
                                clearing.clearingPrice =  0; // no additional bids on either side
                            } else if(i == _consumptionPrices.length){ // buyers left
                                clearing.clearingPrice =  buy.price + 1;
                            } else if(j == _consumptionPrices.length){ // sellers left
                                clearing.clearingPrice =  sell.price - 1;
                            } else { // additional bids on both sides, just no clearing
                                if(i==_consumptionPrices.length){
                                    if(j==_generationPrices.length){
                                        clearing.clearingPrice =  getAvg(a,  b);
                                    }else{
                                        clearing.clearingPrice =  getAvg(a,  sell.price);
                                    }
                                }else{
                                    if(j==_generationPrices.length){
                                        clearing.clearingPrice =  getAvg(buy.price, b);
                                    }else{
                                        clearing.clearingPrice =  getAvg(buy.price, sell.price);
                                    }
                                }
                            }
                        } else {
                            if(i != _consumptionPrices.length && buy.price == a){
                                clearing.clearingPrice =  a;
                            } else if (j != _generationPrices.length && sell.price == b){
                                clearing.clearingPrice =  b;
                            } else if(i != _consumptionPrices.length && getAvg(a,  b) < buy.price){
                                if(i==_consumptionPrices.length){
                                    clearing.clearingPrice =  a + 1;
                                }else{
                                    clearing.clearingPrice =  buy.price + 1;
                                }
                            } else if(j != _generationPrices.length && getAvg(a,  b) > sell.price){
                                if(j==_generationPrices.length){
                                    clearing.clearingPrice =  b - 1;
                                }else{
                                    clearing.clearingPrice =  sell.price - 1;
                                }
                            } else {
                                clearing.clearingPrice = getAvg(a,  b);
                            }
                        }
                    }
                }
                /* check for zero demand but non-zero first unit sell price */
                if (clearing.clearingQuantity==0)
                {
                    clearing.clearingType = 6;
                    clearing.clearingPrice = getClearingPriceDemandZero();
                    
                }else if(clearing.clearingQuantity < consumptionBids[getPriceCap()]){
                    clearing.clearingType = 5;
                    clearing.clearingPrice = getPriceCap();
                }else if(clearing.clearingQuantity < generationBids[-getPriceCap()]){
                    clearing. clearingType = 5;
                    clearing.clearingPrice = -getPriceCap();
                }else if(clearing.clearingQuantity == consumptionBids[getPriceCap()] && clearing.clearingQuantity == generationBids[-getPriceCap()]){
                    clearing.clearingType = 3;
                    clearing.clearingPrice = 0;
                }
                
            }else{
                clearing.clearingPrice =  getClearingPriceOneLengthZero();
                clearing.clearingQuantity = 0;
                clearing.clearingType = 6;
            }

            for (uint cleanConsumptionIndex = 0; cleanConsumptionIndex < _consumptionPrices.length; cleanConsumptionIndex++){
              int consPrice = _consumptionPrices[cleanConsumptionIndex];
              consumptionBids[consPrice] = 0;
            }

            for (uint cleanGenerationIndex = 0; cleanGenerationIndex < _generationPrices.length; cleanGenerationIndex++){
              int genPrice = _generationPrices[cleanGenerationIndex];
              generationBids[genPrice] = 0;
            }

            delete _consumptionPrices;
            delete _generationPrices;

            _consumptionPrices.length = 0;
            _generationPrices.length = 0;
        
    }


    function getClearingPriceOneLengthZero() view private returns(int){
        if( _generationPrices.length > 0 && _consumptionPrices.length == 0){
            return  _generationPrices[0]-1;
        }else if( _generationPrices.length == 0 && _consumptionPrices.length > 0){
            return _consumptionPrices[0]+1;
        }else if( _generationPrices.length > 0 && _consumptionPrices.length > 0){
            return _generationPrices[0] + (_consumptionPrices[0] - _generationPrices[0]) / 2;
        }else if( _generationPrices.length == 0 && _consumptionPrices.length == 0){
            return 0;
        }
    }

    function getClearingPriceDemandZero() view private returns(int){
        if(_generationPrices.length > 0 && _consumptionPrices.length == 0){
            return _generationPrices[0]-1;
        } else if(_generationPrices.length == 0 && _consumptionPrices.length > 0){
            return _consumptionPrices[0]+1;
        } else {
            if(_generationPrices[0] == getPriceCap()){
                return _consumptionPrices[0]+1;
            } else if (_consumptionPrices[0] == -getPriceCap()){
                return _generationPrices[0]-1;
            } else {
                return _generationPrices[0] + (_consumptionPrices[0] - _generationPrices[0]) / 2;
            }
        }
    }


    function getClearingPrice() constant public returns(int){
        return(clearing.clearingPrice);
    }

    function getClearingQuantity() constant public returns(int){
        return(clearing.clearingQuantity);
    }

    function getClearingType() constant public returns(int){
        return(clearing.clearingType);
    }

    function getGenerationsLength() constant public returns(uint){
        return(_generationPrices.length);
    }

    function getConsumptionsLength() constant public returns(uint){
        return(_consumptionPrices.length);
    }

    function getBlockNumberNow() constant public returns(uint){
        return(block.number);
    }

    function getBlockCleared() constant public returns(uint){
        return(blockCleared);
    }

    function deleteMapArrays() public{
        for (uint cleanConsumptionIndex = 0; cleanConsumptionIndex < _consumptionPrices.length; cleanConsumptionIndex++){
          int consPrice = _consumptionPrices[cleanConsumptionIndex];
          consumptionBids[consPrice] = 0;
        }

        for (uint cleanGenerationIndex = 0; cleanGenerationIndex < _generationPrices.length; cleanGenerationIndex++){
          int genPrice = _generationPrices[cleanGenerationIndex];
          generationBids[genPrice] = 0;
        }

        delete _consumptionPrices;
        delete _generationPrices;

        _consumptionPrices.length = 0;
        _generationPrices.length = 0;
    }
}
