import { LightningElement,api,track } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import myResource from '@salesforce/resourceUrl/iahelp__IHResources';

export default class Richtexttableinsert extends LightningElement {
    start = 0;
    end = 0;
    selectMode = 'end';
    xcordinate = 0;
    ycordinate = 0;
    @track myVal = '';
    @track textareaVal='';
    @track showrichtext = true;
    @track showtextarea = false;
    advicetabletoinsert = '';
    adviceswitchtextfields = '';
    @api height;
    @api textareastyle = '';
    connectedCallback(){
        this.myVal = '';
        this.textareastyle = 'border : solid 1px; margin-top : 2px;height :'+ (this.height - 50) +'px;';
        Promise.all([
            loadStyle(this, myResource + '/lib/FontAwesome463/css/font-awesome.min.css')
        ])
        this.internationalise();
    }
    handleChange(event) {
        this.myVal = event.target.value;
        console.log('===>' + this.myVal);
        this.template.querySelector('[data-id="textareaid"]').value = this.formatting(this.myVal+'');
    }

    handleClick() {
        console.log('textareaVal '+this.textareaVal);
        var textAreaVal = this.template.querySelector('[data-id="textareaid"]');
        this.myVal = textAreaVal.value;
        this.template.querySelector('[data-id="textareaid"]').classList.toggle('slds-hide');
        this.template.querySelector('[data-id="richtextid"]').classList.toggle('slds-hide');
        var richTextArea = this.template.querySelector('[data-id="richtextid"]');
        console.log(richTextArea);
       

    }
    formatting(textToFormat){
        console.log('textToFormat >>'+textToFormat);
        const re2 = /></g;
        var returnText = textToFormat.replace(re2,'>\n<');
        var arrlist = returnText.split('\n');
        var finalstring = '';
        try{
                finalstring=arrlist[0];
        }catch(e){}

        var count = 0;
        for(var i=1;i<arrlist.length;i++){
            finalstring += '\n';
            var previousTag = arrlist[i-1].substring(0,arrlist[i-1].indexOf('>')+1);
            console.log(previousTag);
            if(arrlist[i].startsWith("</")){
                count --;
            }
            else{
                if(!arrlist[i].startsWith(previousTag)){
                    count ++;
                }
            }
            for(var j=0;j<count;j++){
                finalstring +="  ";
            }
            finalstring += arrlist[i];
        }
        console.log('returnText >>'+finalstring);
        return finalstring;
    }
    insertTable(){
        var x = this.myVal;
        var model = '<table border="1" style = " width : 100%;">'; //  style="position : absolute; left : '+this.xcordinate+'px;'+' top :'+this.ycordinate+'px"
        var rows = prompt('Rows:', 2);
        var cols = prompt('Cols:', 3);

        for (var r = 0; r < rows; r++) {

            model += '<tr>';
            for (var c = 0; c < cols; c++) {
                model += '<td></td>';
            }
            model += '</tr>';
             
        }

        model += '</table>';

        console.log('Old Value: ' + x);
        x += model;
        this.myVal = x;
        console.log('New Value: ' + x);
        this.template.querySelector('[data-id="textareaid"]').value = this.formatting(this.myVal+'');
    }
    readKeyPress(event){
        console.log('event val readKeyPress '+event.code);
        
  
    }
    readKeyUp(event){
        
     /*   console.log('event code readKeyUp '+event.code);
        this.myVal+=event.key;*/
    }
    readKeyDown(event){
        
        console.log('event code readKeyDown '+event.code);  
        if(event.code+''=='Backspace'){
           // this.myVal = this.myVal.substring(0,this.myVal.length - 4);          
        }
        else{
            this.myVal = event.target.value;
        }
     //   this.myVal+=event.key+'</p>';    
    }
    internationalise(){
        var dictionary = {"insertTable" : "This tool inserts the Table", "toggleEditor" : "This tool is used to make switch between Rich Text & Text Area"};
        this.advicetabletoinsert = dictionary["insertTable"];
        this.adviceswitchtextfields = dictionary["toggleEditor"];
    }
}