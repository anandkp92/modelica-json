package gov.lbl.parser.domain;
import java.util.Collection;

public class Enum_list {
    private Collection<Enumeration_literal> enumeration_literal_list;

    public Enum_list(Collection<Enumeration_literal> enumeration_literal_list) {
        this.enumeration_literal_list = (enumeration_literal_list.size() > 0) ? enumeration_literal_list : null;
    }
}
