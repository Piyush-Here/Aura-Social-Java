package com.aura.repository;

import com.aura.domain.Post;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("""
        select p from Post p
        where (:username is null or p.author.username = :username)
          and (:search is null or lower(p.caption) like lower(concat('%', :search, '%'))
               or lower(p.author.displayName) like lower(concat('%', :search, '%'))
               or lower(p.author.username) like lower(concat('%', :search, '%')))
        order by p.createdAt desc
        """)
    List<Post> search(@Param("search") String search, @Param("username") String username);
}
