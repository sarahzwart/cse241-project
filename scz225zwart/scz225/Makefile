
JAVAC = javac
MAIN_CLASS = App
CLASSPATH = .:ojdbc11.jar
all: compile run
compile:
	$(JAVAC) *.java
run:
	java -cp $(CLASSPATH) $(MAIN_CLASS)
clean:
	rm -f *.class
