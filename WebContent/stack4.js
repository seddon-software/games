class Stack {

    stackWillAccept(dragStack) {
        // examples:
        //
        // a) dropStack = [x x x 8], dropTop = 8
        //    dragStack = [x x x 5 6 7], up = [7 6 5], sequence = 2
        //    transfer whole "up" stack if(dropTop - up[0] == 1)
        //
        // b) dropStack = [x x x J], dropTop = 11
        //    dragStack = [x x 10 9 8 7 6 5], down = [5 6 7 8 9 10], sequence = -5
        //    if 0 free stacks, 1 card  can be transferred, so transfer nothing
        //    if 1 free stacks, 2 cards can be transferred, so transfer nothing
        //    if 2 free stacks, 4 cards can be transferred, so transfer part of "down" stack: [7 8 9 10]
        //    if 3 free stacks, 8 cards can be transferred, so transfer all of "down" stack: [5 6 7 8 9 10]
        //
        
        function getSequence() {
            if(up.length > down.length) 
                return pip(up[0]) - pip(up[up.length-1]);  // up returns >= 0
            else
                return pip(down[0]) - pip(down[down.length-1]); // down returns <= 0 
        }

        function howManyEmptyStacksApartFromUs() {
            var count = 0;
            for(var i = 0; i < stacks.length; i++) {
                var stack = stacks[i];
                if(stack.type === "table" && stack.length() === 0) count++;
            }
            // don't count ourselves if we are a table stack
            if(dragStack.type === "table" && dragStack.length() === 0) count--;
            return count;
        }
        var result = [];
        var dropStack = this;
        var dropTop = dropStack.getTop();
        var dragTop = dragStack.getTop();
        var emptyStacks = howManyEmptyStacksApartFromUs();
        var maxCardsCanMove = Math.pow(2, emptyStacks);
        
        dragStack.compute();
        
        if(dropStack.type === "bank") {
            var cards = dragStack.getInSequence();
            if(dropStack.isEmpty())
                result = cards;
            else {
                if(dragTop - dropTop === 1) return cards;
            }
        }
        if(dropStack.type === "table") {
            var up = dragStack.getUp();
            var down = dragStack.getDown();
////////////////////////////////////////////////
// sequence = 0 is OK
// sequence < 0 is ??? -1 seems to work with all stacks full
            var sequence = getSequence();
            // console.log("***** sequence", sequence);
            if(sequence === 0) { // no sequences
                if(pip(dropTop) - pip(dragTop) === 1 || dropStack.isEmpty()) result = up;
            }

            //    dropStack = [x x x 8], dropTop = 8
            //    dragStack = [x x x 5 6 7], up = [7 6 5], sequence = 2
            //    transfer whole "up" stack if(dropTop - up[0] == 1)
            if(sequence > 0) { // up
                var count = (up.length <= maxCardsCanMove) ? up.length : maxCardsCanMove;
                if(dropStack.isEmpty()) {
                    result = up;
                } else if(pip(dropTop) - pip(dragTop) === 1) {
                    console.log("dropTop", pip(dropTop));
                    console.log("dragTop", pip(dragTop));
                    console.log("up", up);
                    result = up;                    
                }
            } 

            //    dropStack = [x x x J], dropTop = 11
            //    dragStack = [x x 10 9 8 7 6 5], down = [5 6 7 8 9 10], sequence = -5
            //    if 0 free stacks, 1 card  can be transferred, so transfer nothing
            //    if 1 free stacks, 2 cards can be transferred, so transfer nothing
            //    if 2 free stacks, 4 cards can be transferred, so transfer part of "down" stack: [7 8 9 10]
            //    if 3 free stacks, 8 cards can be transferred, so transfer all of "down" stack: [5 6 7 8 9 10]
            if(sequence < 0) { // down
                if(dropStack.isEmpty()) {
                    result = down;
                    // down = [9 10 J] dropTop = K, sequence = -2, so dropTop - down[0] = 4  => notOK
                    // down = [9 10 J] dropTop = Q, sequence = -2, so dropTop - down[0] = 3  => OK, [9, 10, J]
                    // down = [9 10 J] dropTop = J, sequence = -2, so dropTop - down[0] = 2  => OK, [9 10]
                    // down = [9 10 J] dropTop = 10, sequence = -2, so dropTop - down[0] = 1  => OK, [9]
                    // down = [9 10 J] dropTop = 9, sequence = -2, so dropTop - down[0] = 0  => notOK
                    // dropTop-1 must be in down
                    // 
                    
                } else {
                    function pips(array) {
                        var result = [];
                        for(var i = 0; i < array.length; i++) {
                            result.push(pip(array[i]));
                        }
                        return result;
                    }
                    // if down = [9 10 J], dropTop must be a 10, J or Q
                    // i.e. dropTop-1 must be in down
                    // transfer part of down upto and including dropTop-1
                    var downPips = pips(down);
                    var index = downPips.indexOf(pip(dropTop)-1);
                    var xfer = down.slice(0, index+1);
                    var count = (down.length <= maxCardsCanMove) ? down.length : maxCardsCanMove;
                    if(xfer.length <= count) result = xfer;
                }
            }

        }
        return result;
    }

    constructor(id, index, type) {
        this.id = id;
        this.type = type;
        this.index = index;
        this.cards = [];
        this.up = [];
        this.down = [];
        this.inSequence = [];
    }

    static find(searchType, searchId) {
        var result;
        for(var i = 0; i < stacks.length; i++) {
            var type = stacks[i].type;
            var id = stacks[i].id;
            if(searchType === type && searchId === id) {
                result = stacks[i];
                break;
            } 
        }
        return result;
    }
    
    doDragAndDrop() {
        var stack = this;
        // disable drag and drop on all but last card
        for(var i = 0; i < stack.cards.length; i++) {
            var card = stack.cards[i];
            var div = DOM[card];
            div.draggable("disable");
            div.droppable("disable");
        }
        // make last card drag and droppable
        if(!stack.isStackEmpty() && stack.type === "table") {
            var top = stack.getTop();
            var div = DOM[top];
            div.draggable("enable");
            div.droppable("enable");
        }
    }

    findCard(div) {
        var position = -1;
        var card = div.data("card-info").cardIndex;
        for(var i = 0; i < this.length(); i++) {
            if(this.cards[i] === card) {
                position = i;
                break;
            }
        }
        return position;
    }
    
    compute() {
        // up: [x x 3 4 5] is stored as 5 4 3 (working from top)
        // down: [ x x 6 5 4] is stored as 4 5 6 (working from top)
        // inSequence: like down, but must be all the same suit
        function buildSequence(array, comparator) {
            var top = stack.getTop();
            array.push(top);
            for(var i = cards.length - 2;  i >= 0; i--) {
                var next = cards[i];
                if(cardIsFaceDown(next)) break;
                if(!comparator(next, top)) break;
                top = next;
                array.push(top);
            }                        
        }
        var stack = this;
        var cards = this.cards;        
        this.up = [];
        this.down = [];
        this.inSequence = [];
        buildSequence(this.up, function(a,b){ return pip(b) - pip(a) === 1})
        buildSequence(this.down, function(a,b){ return pip(a) - pip(b) === 1})
        buildSequence(this.inSequence, function(a,b){ return a%52 - b%52 === 1})
        var stack = this;
        function logit() {
            var x = [];
            for(var i = 0; i < stack.down.length; i++) {
                x.push(pip(stack.down[i]))
            }
            console.log("down", x);
            var x = [];
            for(var i = 0; i < stack.up.length; i++) {
                x.push(pip(stack.up[i]))
            }
            console.log("up", x);
            var x = [];
            for(var i = 0; i < stack.inSequence.length; i++) {
                x.push(stack.inSequence[i]%52)
            }
            console.log("inSequence", x);
        }
//        logit();
    }
    
    getTop() {
        return this.cards[this.cards.length - 1];
    }
    
    length() {
        return this.cards.length;        
    }

    isStackEmpty() {
        return this.length() === 0;
    }
    
    push(card) {
        this.cards.push(card);
        var div = DOM[card];
        div.data("card-info", 
        { 
            stackIndex: this.index,
            cardIndex: card
        });
        makeDraggable(div);
        makeDroppable(div);        
    }
    
    transfer(fromStack, cards, undo) {
        function isDown(array) {
            return array[array.length-1] - array[0] < 0;
        }
        
        var toStack = this;
        var count = cards.length;
        for(var i = 0; i < count; i++) {
            fromStack.cards.pop();
        }
        
        for(var i = 0; i < count; i++) {
            var card = cards.pop();
            toStack.cards.push(card);
            var div = DOM[card];
            div.data("card-info").stackIndex = toStack.index;
        }
      
        fromStack.resetDragAndDrop();
        toStack.resetDragAndDrop();
        redraw();
    }
    
    resetDragAndDrop() {
        var stack = this;
        // disable drag and drop on all but last card
        for(var i = 0; i < stack.cards.length; i++) {
            var card = stack.cards[i];
            var div = DOM[card];
            div.draggable("disable");
            div.droppable("disable");
        }
        // make last card drag and droppable
        if(!stack.isStackEmpty() && stack.type === "table") {
            var top = stack.getTop();
            var div = DOM[top];
            div.draggable("enable");
            div.droppable("enable");
        }
    }

    getInSequence() {
        return this.inSequence;    
    }
    
    getUp() {
        return this.up;    
    }
    
    getDown() {
        return this.down;    
    }
    
    isEmpty() {
        return this.length() === 0;    
    }
    
    removeClickHandler() {
        if(this.type === "pack") {
            var packStack = this;
            for(var i = 0; i < this.cards.length; i++) {
                var card = this.cards[i];
                var div = DOM[card];
                div.off("click");
            }
        }        
    }
    
    addClickHandler() {
        // add click handler to top of pack
        var packStack = this;
        var top = packStack.getTop();
        var div = DOM[top];
        div.click(packStack, packClickHandler);
    }


}

// end of class
// global functions follow

