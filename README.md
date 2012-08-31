EnrichmentUIWidget
==================

The Knowledge Base Enrichment User Interface is implemented as jQuery widget and also makes use of the JavaScript library jQuery EasyUI for some graphical components. The underlying learning algorithms are part of the DL-Learner Framework and called via AJAX requests to a Java Servlet which must be deployed on an accessible server.
In order to use the widget in other web projects the following parameters have to be specified:

* **SPARQL endpoint URL:** The URL of the SPARQL endpoint and optionally the default graph URL on which the enrichment algorithms will be executed.
* **Service URL:** Declares the URL of the Java Servlet which is called to execute the corresponding learning algorithms.

Integration into HTML page:
---------------------------

Put the war file enrichment.war on a Java Servlet container, e.g. for Tomcat 6 it would be

    cd EnrichmentUIWidget
    cp enrichment.war /PATH/TO/TOMCAT6/webapps/

Link to the necessary JavaScript and CSS files into your project

    <html>
    <head>
      ...
      ...
      <script type="text/javascript" src="js/jquery.min.js"></script>
      <script type="text/javascript" src="js/jquery-ui.min.js"></script>
      <script type="text/javascript" src="js/jquery.easyui.min.js"></script>
      <script type="text/javascript" src="jquery.ui.enrichment.js"></script>
      <link rel="stylesheet" type="text/css" 
          href="css/ui-darkness/jquery-ui-1.8.22.custom.css"></link>
      <link rel="stylesheet" type="text/css" href="css/default/easyui.css"></link>
      <link rel="stylesheet" type="text/css" href="css/icon.css"></link>
      <link rel="stylesheet" type="text/css" href="css/enrichment.css"></link>
    </head>
    ...

Create a container element with an <b>ID</b> 

    <div id="enrichment-container"></div>

call the jQuery plugin on it using $("<b>ID</b>").enrichment() and set the parameters for the SPARQL endpoint URL and the Java Servlet URL, e.g.

    <script type="text/javascript">
        $("#enrichment-container").enrichment({
          'service_url':'http://localhost:8080/enrichment/Enrichment',
          'endpoint': {
            'url': 'http://dbpedia.org/sparql',
            'graph': 'http://dbpedia.org'
          }
      });
    </script>

Configuration Parameters
------------------------

The enrichment user interfaces allows to configure the following parameters which affect the axiom learning
process:
    
* **Resource URI** is used to specify the resource (property or class) which should be enriched.
* **Resource Type** allows to determine of which type of entity the resource is. This implicitly works as a filter on the allowed and executed learning algorithms.
* **Inference** allows to turn inference on or off. If it is turned on, in a preprocessing step the class hierarchy is computed. Powerful reasoning capabilities may improve the quality of suggestions, in particular for those axioms, which rely on knowing the class hierarchy of the knowledge base, e.g. domain and range axioms.
* **Max. execution time** specifies the maximum execution time in seconds for each algorithm run.
* **Max. returned axioms** specifies the maximum number of returned axioms per axiom type.
* **Threshold** allows to specify a threshold for enrichment suggestions, i.e. suggestions with a lower score will be omitted.
* **Axiom Types** is used to choose for which type of axioms the learning algorithm will be executed.

